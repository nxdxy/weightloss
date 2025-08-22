
import React from 'react';

// 图标组件
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const NutritionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.05 48.05 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.062 12.25c.138.826-.554 1.5-1.562 1.5H4.75c-1.008 0-1.7-.674-1.562-1.5L5.25 5.47m13.5-.47z" />
  </svg>
);

const PotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClipboardDocumentListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0.621 0 1.125-.504 1.125-1.125V9.375c0-.621.504-1.125 1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const PuzzlePieceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
  </svg>
);

const BuildingStorefrontIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
  </svg>
);

const QuestionMarkCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = '' }) => (
  <div className={`group relative ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 bg-cyan-500/20 text-cyan-400 rounded-lg p-3 border border-cyan-500/30">
          {icon}
        </div>
        <div className="ml-4">
          <div className="w-2 h-2 bg-cyan-400 rounded-full mb-1 animate-pulse"></div>
          <h3 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider">{title}</h3>
        </div>
      </div>
      <div className="text-gray-300 space-y-3 flex-grow">
        {children}
      </div>
    </div>
  </div>
);

const FoodList: React.FC<{ title: string; items: (string | React.ReactNode)[]; color: 'green' | 'red' | 'blue' }> = ({ title, items, color }) => {
    const colorClasses = {
        green: 'text-green-400',
        red: 'text-red-400',
        blue: 'text-cyan-400'
    };
    return (
        <div>
            <h4 className={`font-bold text-md font-mono ${colorClasses[color]}`}>{title}</h4>
            <ul className="list-disc list-outside pl-5 mt-1 space-y-1 text-gray-300">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-gray-100 text-base font-mono">{title}</h4>
        <div className="mt-2">{children}</div>
    </div>
);


export const FoodKnowledgePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 科技风格标题 */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              <h1 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 sm:text-4xl uppercase tracking-wider">
                FOOD KNOWLEDGE BASE
              </h1>
              <div className="w-3 h-3 bg-cyan-400 rounded-full ml-3 animate-pulse"></div>
            </div>
            <p className="text-gray-400 font-light text-lg">您的健康膳食与营养百科全书</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <InfoCard icon={<SparklesIcon className="w-7 h-7" />} title="核心饮食原则">
                <ul className="space-y-3">
                    <li><strong>均衡营养优先：</strong>确保每餐都包含蛋白质、健康脂肪和复合碳水化合物，这是持续供能和维持肌肉的关键。</li>
                    <li><strong>食物多样化：</strong>尽量选择不同种类的食物，特别是蔬菜和水果，以获取全面的维生素和矿物质。彩虹色饮食法（吃各种颜色的蔬果）是一个好方法。</li>
                    <li><strong>天然食物为主：</strong>选择加工程度最低的食物。天然食物通常营养密度更高，且不含多余的糖、盐和不健康脂肪。</li>
                    <li><strong>热量缺口是关键：</strong>减脂的核心是消耗的热量大于摄入的热量，但缺口不宜过大（建议300-500千卡），以免影响新陈代谢和肌肉流失。</li>
                     <li><strong>一致性大于完美：</strong>遵循“80/20”法则（80%的时间健康饮食，20%的时间适度放纵）更能帮助你长期坚持。</li>
                </ul>
            </InfoCard>

            <InfoCard icon={<NutritionIcon className="w-7 h-7" />} title="宏量营养素：蛋白质">
                <p>蛋白质是肌肉生长和修复的基础，饱腹感最强，能提高食物热效应（消化它需要更多能量）。</p>
                <FoodList title="我该吃多少？" color="blue" items={["对于减脂和健身人群，推荐每日摄入量为每公斤体重1.6-2.2克。例如，70公斤的人需要112-154克。"]}/>
                <FoodList title="优质来源 (推荐)" color="green" items={["鸡胸肉、火鸡肉、93%瘦牛肉", "三文鱼、金枪鱼、虾", "鸡蛋、希腊酸奶、茅屋奶酪", "豆腐、毛豆、扁豆、鹰嘴豆", "优质乳清蛋白粉"]} />
                <FoodList title="限制来源" color="red" items={["肥肉、加工肉肠、培根", "油炸肉类", "含糖的蛋白棒和奶昔"]} />
            </InfoCard>
            
            <InfoCard icon={<NutritionIcon className="w-7 h-7" />} title="宏量营养素：碳水">
                <p>碳水是身体首选的能量来源，为高强度训练供能。关键是选择升糖指数(GI)低的复合碳水。</p>
                <FoodList title="摄入时机" color="blue" items={["将一天中大部分碳水安排在训练前后，为训练提供能量并促进恢复。早餐和午餐也适合摄入，晚餐可适当减少。"]}/>
                <FoodList title="优质来源 (推荐)" color="green" items={["燕麦、糙米、藜麦、荞麦", "红薯、紫薯、山药、玉米", "全麦面包/意面", "各类蔬菜（绿叶菜、西兰花）", "适量水果（浆果、苹果）"]} />
                <FoodList title="限制来源" color="red" items={["含糖饮料、果汁、奶茶", "糖果、糕点、饼干、冰淇淋", "白米饭、白面包、精制面条", "加糖的早餐麦片"]} />
            </InfoCard>

            <InfoCard icon={<NutritionIcon className="w-7 h-7" />} title="宏量营养素：脂肪">
                <p>健康脂肪对激素平衡、维生素吸收至关重要。你需要区分不同种类的脂肪。</p>
                <FoodList title="好脂肪 (多不饱和/单不饱和)" color="green" items={["牛油果、橄榄油", "坚果（杏仁、核桃）、种子（奇亚籽、亚麻籽）", "多脂鱼（三文鱼、鲭鱼）中的Omega-3"]} />
                <FoodList title="中性脂肪 (饱和脂肪)" color="blue" items={["适量摄入即可，无需完全禁止。来源：红肉、全脂乳制品、椰子油。"]} />
                <FoodList title="坏脂肪 (反式脂肪)" color="red" items={["应完全避免！常见于人造黄油、起酥油、以及很多包装零食和油炸快餐中。请检查食品标签。"]}/>
            </InfoCard>
            
            <InfoCard icon={<PotIcon className="w-7 h-7" />} title="实用技巧">
                <SubSection title="智慧烹饪与调味">
                    <div>
                        <h4 className="font-bold text-gray-200">推荐烹饪方式</h4>
                        <p className="text-gray-300">蒸、煮、烤、快炒、空气炸。这些方法能最大程度保留营养，并减少额外油脂的摄入。</p>
                    </div>
                    <div className="mt-2">
                        <h4 className="font-bold text-gray-200">限制烹饪方式</h4>
                        <p className="text-gray-300">油炸、红烧、糖醋、爆炒。这些方法通常会增加大量不必要的热量和脂肪。</p>
                    </div>
                     <div className="mt-2">
                        <h4 className="font-bold text-gray-200">调味魔法</h4>
                        <p className="text-gray-300">善用天然香料：大蒜、生姜、洋葱、辣椒、黑胡椒、孜然、肉桂、香草（迷迭香、百里香）以及醋和柠檬汁。它们几乎不含热量，却能极大提升风味。</p>
                    </div>
                </SubSection>
                <hr className="my-4 border-gray-700"/>
                <SubSection title="份量控制指南">
                    <p>无需厨房秤，用您的手就能估算份量：</p>
                    <ul>
                        <li><span className="font-mono mr-2">✋</span> <strong>蛋白质（肉、鱼）：</strong>一个手掌心大小和厚度。</li>
                        <li><span className="font-mono mr-2">✊</span> <strong>复合碳水（米饭、面）：</strong>一个拳头大小。</li>
                        <li><span className="font-mono mr-2">🤲</span> <strong>蔬菜：</strong>双手捧起的量，多多益善。</li>
                        <li><span className="font-mono mr-2">🤏</span> <strong>健康脂肪（坚果）：</strong>一个手掌自然弯曲能抓住的量。</li>
                        <li><span className="font-mono mr-2">👍</span> <strong>油脂（烹饪油、沙拉酱）：</strong>一个大拇指尖的大小。</li>
                    </ul>
                </SubSection>
            </InfoCard>

            <InfoCard icon={<ClockIcon className="w-7 h-7" />} title="日常策略">
                <SubSection title="一日三餐与加餐">
                    <p>合理的进餐规划能帮你稳定血糖，控制饥饿感，保持精力充沛。</p>
                    <ul>
                        <li><strong className="text-gray-100">活力早餐 <SunIcon className="w-4 h-4 inline-block"/>:</strong> 必须包含优质蛋白和膳食纤维。例如：鸡蛋/希腊酸奶 + 全麦面包/燕麦 +少量水果。</li>
                        <li><strong className="text-gray-100">能量午餐:</strong> 遵循“餐盘法则”：1/2蔬菜 + 1/4蛋白质 + 1/4复合碳水。</li>
                        <li><strong className="text-gray-100">轻盈晚餐 <MoonIcon className="w-4 h-4 inline-block"/>:</strong> 蛋白质+大量蔬菜。建议在睡前3-4小时完成进餐。</li>
                        <li><strong className="text-gray-100">智慧加餐:</strong> 当感到饥饿时，选择健康的零食。例如：一小把坚果、一个苹果、一盒无糖酸奶、一根黄瓜。</li>
                    </ul>
                </SubSection>
                <hr className="my-4 border-gray-700"/>
                <SubSection title="饮水与饮料选择">
                    <p>充足饮水可以提高新陈代谢、增加饱腹感、帮助身体排毒、提升运动表现。</p>
                    <p className="font-bold">建议每日饮水量：体重（公斤）x 35-45毫升。</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <FoodList title="健康饮品 (绿灯)" color="green" items={["白水/矿泉水", "无糖苏打水", "黑咖啡（适量）", "绿茶/红茶/花草茶"]} />
                        <FoodList title="热量刺客 (红灯)" color="red" items={["所有含糖饮料", "果汁（即使是纯果汁）", "奶茶、风味拿铁", "酒精类饮品"]} />
                    </div>
                </SubSection>
            </InfoCard>

            <InfoCard icon={<ClipboardDocumentListIcon className="w-7 h-7" />} title="备餐入门：效率与掌控">
                <p>备餐（Meal Prep）是饮食成功的秘密武器。每周投入几小时，就能让你在忙碌的工作日里轻松掌控饮食，告别外卖和压力进食。</p>
                <SubSection title="四步备餐法">
                    <ol className="list-decimal list-outside pl-5 space-y-1">
                        <li><strong>计划：</strong>决定接下来3-4天的午餐和晚餐。从简单的食谱开始。</li>
                        <li><strong>采购：</strong>根据计划列出购物清单，一次性买齐所有食材。</li>
                        <li><strong>烹饪：</strong>批量烹饪。烤几块鸡胸肉、煮一大锅糙米、切好一周的蔬菜。</li>
                        <li><strong>分装：</strong>将做好的食物按每餐的份量装入密封容器，冷藏保存。</li>
                    </ol>
                </SubSection>
                <p className="font-bold mt-2 text-cyan-400">专业提示：从准备3天的午餐开始，慢慢找到适合自己的节奏。</p>
            </InfoCard>

            <InfoCard icon={<TagIcon className="w-7 h-7" />} title="读懂食品标签：避开陷阱">
                <p>包装正面是营销，背面才是事实。学会阅读标签，才能做出真正明智的选择。</p>
                <SubSection title="营养成分表">
                    <ul className="list-disc list-outside pl-5 space-y-1">
                        <li><strong>注意份量：</strong>这是头号陷阱！所有数值都针对“每份”，但一个包装可能含多份。</li>
                        <li><strong>关注“添加糖”：</strong>目标是尽可能低。</li>
                        <li><strong>警惕“钠”含量：</strong>尤其是罐头和加工食品。</li>
                    </ul>
                </SubSection>
                 <SubSection title="配料表">
                    <ul className="list-disc list-outside pl-5 space-y-1">
                        <li><strong>排序很重要：</strong>配料按重量从多到少排列。如果糖排在前几位，请放回去。</li>
                        <li><strong>越短越好：</strong>一长串看不懂的化学名词通常是危险信号。</li>
                        <li><strong>识别“隐形糖”：</strong>警惕各种形式的糖，如果葡糖浆、麦芽糖、右旋糖等。</li>
                    </ul>
                </SubSection>
            </InfoCard>

            <InfoCard icon={<PuzzlePieceIcon className="w-7 h-7" />} title="应对平台期与食欲">
                 <p>平台期和食欲是减脂路上的必经关卡。学会科学应对，而不是自暴自弃。</p>
                 <SubSection title="体重停滞（平台期）怎么办？">
                     <ul className="list-disc list-outside pl-5 space-y-1">
                         <li><strong>检查一致性：</strong>你是否真的严格执行了计划？尝试精准记录一周。</li>
                         <li><strong>微调变量：</strong>略微降低热量（100-200千卡）或增加活动量（如每天多走15分钟）。</li>
                         <li><strong>关注非体重指标：</strong>腰围、体感、精力、衣服的贴合度都是进步的证明。</li>
                         <li><strong>考虑“饮食休息”：</strong>恢复到维持热量吃1-2周，可以重置激素和心理状态。</li>
                     </ul>
                 </SubSection>
                 <SubSection title="食欲来袭时怎么办？">
                     <ul className="list-disc list-outside pl-5 space-y-1">
                         <li><strong>先喝水：</strong>喝一大杯水，等待15分钟。很多时候口渴被误认为饥饿。</li>
                         <li><strong>吃高蛋白零食：</strong>蛋白质能提供强烈的饱腹感。</li>
                         <li><strong>计划性满足：</strong>利用“80/20”原则中的“20%”，主动、少量地满足你的渴望。</li>
                         <li><strong>改变环境：</strong>出门散步、打电话给朋友，或者做些别的事情来转移注意力。</li>
                     </ul>
                 </SubSection>
            </InfoCard>
            
            <InfoCard icon={<BuildingStorefrontIcon className="w-7 h-7" />} title="外出就餐指南">
                 <p>社交和聚餐也能吃得健康！记住这些技巧：</p>
                 <ol className="list-decimal list-outside pl-5 space-y-1">
                     <li>提前在线查看菜单，做好计划。</li>
                     <li>选择烹饪方式：优先选择“烤”、“蒸”、“煮”的菜品，避开“炸”、“脆皮”、“焗”。</li>
                     <li>酱汁分开放：请求将沙拉酱、调味汁等分开放置，自己控制用量。</li>
                     <li>明智的配菜：用沙拉或蒸蔬菜代替薯条或米饭。</li>
                     <li>蛋白质优先：确保你的餐点中有足量的瘦蛋白，它能让你更快感到饱腹。</li>
                     <li>控制饮酒：酒精是“液体热量”，尽量选择水或无糖茶。</li>
                     <li>主动要求：不要害怕要求“少油少盐”或对菜品进行调整。</li>
                     <li>分享甜点：如果想吃甜点，和朋友分享一小份。</li>
                 </ol>
            </InfoCard>

            <InfoCard icon={<QuestionMarkCircleIcon className="w-7 h-7" />} title="常见饮食误区破解">
                <ul>
                    <li><strong>误区：碳水化合物使人发胖。</strong><br/>真相：让你发胖的是总热量超标，而不是碳水本身。优质的复合碳水是能量的重要来源。</li>
                    <li><strong>误区：“无脂肪”产品更健康。</strong><br/>真相：很多脱脂产品为了口感会添加大量的糖和添加剂，热量可能更高。</li>
                    <li><strong>误区：必须一天吃六顿小餐才能促进新陈代谢。</strong><br/>真相：进餐频率对大多数人的新陈代谢影响甚微，更重要的是全天的总热量和营养素摄入。</li>
                    <li><strong>误区：晚上8点后吃东西会长胖。</strong><br/>真相：身体不会因为时钟指向8点就改变卡路里的计算方式。重要的是全天总摄入量。</li>
                </ul>
            </InfoCard>
            
            <InfoCard icon={<BookOpenIcon className="w-7 h-7" />} title="关于补剂的理性看法">
                 <p>补剂永远是“补充”，而不是“替代”。在稳固的饮食基础上，这些补剂可能对你有帮助：</p>
                 <ul className="list-disc list-outside pl-5 space-y-2">
                    <li><strong>乳清蛋白粉：</strong>在训练后或日常蛋白质摄入不足时，是方便快捷的补充方式。但它并不比鸡胸肉更神奇。</li>
                    <li><strong>肌酸（一水肌酸）：</strong>被最广泛、最深入研究的补剂之一，能有效提升力量、爆发力和肌肉量，安全且便宜。</li>
                    <li><strong>鱼油 (Omega-3)：</strong>具有强大的抗炎作用，对心血管健康和大脑功能有益，是多数人饮食中容易缺乏的。</li>
                    <li><strong>维生素D3：</strong>除非你每天都能晒足太阳，否则很可能缺乏。它对骨骼健康、免疫功能和激素水平至关重要。</li>
                </ul>
                 <p className="text-xs italic mt-4">使用任何补剂前，建议咨询医生或营养师。优先通过天然食物获取营养。</p>
            </InfoCard>
        </div>
      </div>
    </div>
  );
};
