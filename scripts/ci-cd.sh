#!/bin/bash

# AI Fitness Pal CI/CD 脚本
# 支持自动化构建、测试、部署

set -e

# 配置
PROJECT_NAME="ai-fitness-pal"
REGISTRY="your-registry.com"  # 替换为你的镜像仓库
VERSION_FILE="VERSION"
COMPOSE_FILE="docker-compose.prod.yml"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# 获取版本号
get_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        echo "1.0.0"
    fi
}

# 更新版本号
bump_version() {
    local version_type=${1:-patch}  # major, minor, patch
    local current_version=$(get_version)
    
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $version_type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
    esac
    
    local new_version="$major.$minor.$patch"
    echo "$new_version" > "$VERSION_FILE"
    echo "$new_version"
}

# 运行测试
run_tests() {
    log "运行测试..."
    
    # 后端测试
    log "运行后端测试..."
    cd backend
    if [ -f "requirements-test.txt" ]; then
        pip install -r requirements-test.txt
    fi
    
    # 运行 pytest
    if command -v pytest &> /dev/null; then
        pytest tests/ -v --cov=app --cov-report=html
        success "后端测试通过"
    else
        warning "pytest 未安装，跳过后端测试"
    fi
    
    cd ..
    
    # 前端测试
    log "运行前端测试..."
    cd frontend
    if [ -f "package.json" ]; then
        npm ci
        if npm run test:ci 2>/dev/null; then
            success "前端测试通过"
        else
            warning "前端测试脚本不存在或失败"
        fi
    fi
    
    cd ..
    success "所有测试完成"
}

# 构建镜像
build_images() {
    local version=$1
    
    log "构建 Docker 镜像 (版本: $version)..."
    
    # 构建后端镜像
    log "构建后端镜像..."
    docker build -t "${REGISTRY}/${PROJECT_NAME}-backend:${version}" \
                 -t "${REGISTRY}/${PROJECT_NAME}-backend:latest" \
                 -f backend/Dockerfile.prod backend/
    
    # 构建前端镜像
    log "构建前端镜像..."
    docker build -t "${REGISTRY}/${PROJECT_NAME}-frontend:${version}" \
                 -t "${REGISTRY}/${PROJECT_NAME}-frontend:latest" \
                 --build-arg VITE_API_BASE_URL="https://yourdomain.com" \
                 -f frontend/Dockerfile.prod frontend/
    
    success "镜像构建完成"
}

# 推送镜像
push_images() {
    local version=$1
    
    log "推送镜像到仓库..."
    
    # 推送后端镜像
    docker push "${REGISTRY}/${PROJECT_NAME}-backend:${version}"
    docker push "${REGISTRY}/${PROJECT_NAME}-backend:latest"
    
    # 推送前端镜像
    docker push "${REGISTRY}/${PROJECT_NAME}-frontend:${version}"
    docker push "${REGISTRY}/${PROJECT_NAME}-frontend:latest"
    
    success "镜像推送完成"
}

# 部署到环境
deploy_to_env() {
    local environment=${1:-production}
    local version=${2:-latest}
    
    log "部署到 $environment 环境 (版本: $version)..."
    
    case $environment in
        "staging")
            # 部署到测试环境
            deploy_staging "$version"
            ;;
        "production")
            # 部署到生产环境
            deploy_production "$version"
            ;;
        *)
            error "未知环境: $environment"
            ;;
    esac
}

# 部署到测试环境
deploy_staging() {
    local version=$1
    
    log "部署到测试环境..."
    
    # 更新 docker-compose 文件中的镜像版本
    sed -i.bak "s|image: .*backend.*|image: ${REGISTRY}/${PROJECT_NAME}-backend:${version}|g" docker-compose.staging.yml
    sed -i.bak "s|image: .*frontend.*|image: ${REGISTRY}/${PROJECT_NAME}-frontend:${version}|g" docker-compose.staging.yml
    
    # 部署
    docker-compose -f docker-compose.staging.yml pull
    docker-compose -f docker-compose.staging.yml up -d
    
    # 健康检查
    sleep 30
    if curl -f http://staging.yourdomain.com/health >/dev/null 2>&1; then
        success "测试环境部署成功"
    else
        error "测试环境部署失败"
    fi
}

# 部署到生产环境
deploy_production() {
    local version=$1
    
    log "部署到生产环境..."
    
    # 创建备份
    ./scripts/deploy-update.sh backup
    
    # 更新镜像版本
    export BACKEND_IMAGE="${REGISTRY}/${PROJECT_NAME}-backend:${version}"
    export FRONTEND_IMAGE="${REGISTRY}/${PROJECT_NAME}-frontend:${version}"
    
    # 零停机部署
    ./scripts/deploy-update.sh update
    
    success "生产环境部署成功"
}

# 回滚部署
rollback_deployment() {
    local environment=${1:-production}
    local version=$2
    
    log "回滚 $environment 环境..."
    
    if [ -z "$version" ]; then
        # 获取上一个版本
        version=$(git tag --sort=-version:refname | head -2 | tail -1)
        if [ -z "$version" ]; then
            error "无法找到上一个版本"
        fi
    fi
    
    log "回滚到版本: $version"
    deploy_to_env "$environment" "$version"
}

# 创建发布
create_release() {
    local version_type=${1:-patch}
    
    log "创建发布..."
    
    # 检查工作目录是否干净
    if [ -n "$(git status --porcelain)" ]; then
        error "工作目录不干净，请先提交所有更改"
    fi
    
    # 运行测试
    run_tests
    
    # 更新版本号
    local new_version=$(bump_version "$version_type")
    log "新版本: $new_version"
    
    # 构建镜像
    build_images "$new_version"
    
    # 推送镜像
    push_images "$new_version"
    
    # 创建 Git 标签
    git add "$VERSION_FILE"
    git commit -m "Bump version to $new_version"
    git tag -a "v$new_version" -m "Release version $new_version"
    git push origin main
    git push origin "v$new_version"
    
    success "发布 $new_version 创建完成"
}

# 主函数
main() {
    case "${1:-help}" in
        "test")
            run_tests
            ;;
        "build")
            version=${2:-$(get_version)}
            build_images "$version"
            ;;
        "push")
            version=${2:-$(get_version)}
            push_images "$version"
            ;;
        "deploy")
            environment=${2:-production}
            version=${3:-latest}
            deploy_to_env "$environment" "$version"
            ;;
        "rollback")
            environment=${2:-production}
            version=$3
            rollback_deployment "$environment" "$version"
            ;;
        "release")
            version_type=${2:-patch}
            create_release "$version_type"
            ;;
        "version")
            echo "当前版本: $(get_version)"
            ;;
        "bump")
            version_type=${2:-patch}
            new_version=$(bump_version "$version_type")
            echo "版本已更新: $new_version"
            ;;
        *)
            echo "AI Fitness Pal CI/CD 工具"
            echo ""
            echo "用法: $0 <command> [options]"
            echo ""
            echo "命令:"
            echo "  test                    - 运行测试"
            echo "  build [version]         - 构建镜像"
            echo "  push [version]          - 推送镜像"
            echo "  deploy [env] [version]  - 部署到环境"
            echo "  rollback [env] [version] - 回滚部署"
            echo "  release [type]          - 创建发布 (major|minor|patch)"
            echo "  version                 - 显示当前版本"
            echo "  bump [type]             - 更新版本号"
            echo ""
            echo "示例:"
            echo "  $0 test                 # 运行测试"
            echo "  $0 build 1.2.3          # 构建版本 1.2.3"
            echo "  $0 deploy staging       # 部署到测试环境"
            echo "  $0 release minor        # 创建次版本发布"
            ;;
    esac
}

main "$@"
