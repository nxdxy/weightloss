
import React from 'react';
import { NutritionIcon, BookOpenIcon, SparklesIcon, ScaleIcon, ClockIcon, PotIcon, WaterDropIcon, SunIcon, MoonIcon, BuildingStorefrontIcon, QuestionMarkCircleIcon, ClipboardDocumentListIcon, TagIcon, PuzzlePieceIcon } from './Icons';

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 flex flex-col ${className}`}>
    <div className="flex items-center mb-4">
      <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-lg p-3">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ml-4">{title}</h3>
    </div>
    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 space-y-4 prose prose-sm sm:prose-base dark:prose-invert max-w-none flex-grow">
      {children}
    </div>
  </div>
);

const FoodList: React.FC<{ title: string; items: (string | React.ReactNode)[]; color: 'green' | 'red' | 'blue' }> = ({ title, items, color }) => {
    const colorClasses = {
        green: 'text-green-600 dark:text-green-400',
        red: 'text-red-600 dark:text-red-400',
        blue: 'text-blue-600 dark:text-blue-400'
    };
    return (
        <div>
            <h4 className={`font-bold text-md ${colorClasses[color]}`}>{title}</h4>
            <ul className="list-disc list-outside pl-5 mt-1 space-y-1 text-gray-500 dark:text-gray-400">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};

const SubSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-base">{title}</h4>
        <div className="mt-2">{children}</div>
    </div>
);


export const FoodKnowledgeBase: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">饮食知识库</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">您的健康膳食与营养百科全书。</p>
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
                        <h4 className="font-bold">推荐烹饪方式</h4>
                        <p className="text-gray-500 dark:text-gray-400">蒸、煮、烤、快炒、空气炸。这些方法能最大程度保留营养，并减少额外油脂的摄入。</p>
                    </div>
                    <div className="mt-2">
                        <h4 className="font-bold">限制烹饪方式</h4>
                        <p className="text-gray-500 dark:text-gray-400">油炸、红烧、糖醋、爆炒。这些方法通常会增加大量不必要的热量和脂肪。</p>
                    </div>
                     <div className="mt-2">
                        <h4 className="font-bold">调味魔法</h4>
                        <p className="text-gray-500 dark:text-gray-400">善用天然香料：大蒜、生姜、洋葱、辣椒、黑胡椒、孜然、肉桂、香草（迷迭香、百里香）以及醋和柠檬汁。它们几乎不含热量，却能极大提升风味。</p>
                    </div>
                </SubSection>
                <hr className="my-4 border-gray-200 dark:border-gray-700"/>
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
                        <li><strong className="text-gray-800 dark:text-gray-100">活力早餐 <SunIcon className="w-4 h-4 inline-block"/>:</strong> 必须包含优质蛋白和膳食纤维。例如：鸡蛋/希腊酸奶 + 全麦面包/燕麦 +少量水果。</li>
                        <li><strong className="text-gray-800 dark:text-gray-100">能量午餐:</strong> 遵循“餐盘法则”：1/2蔬菜 + 1/4蛋白质 + 1/4复合碳水。</li>
                        <li><strong className="text-gray-800 dark:text-gray-100">轻盈晚餐 <MoonIcon className="w-4 h-4 inline-block"/>:</strong> 蛋白质+大量蔬菜。建议在睡前3-4小时完成进餐。</li>
                        <li><strong className="text-gray-800 dark:text-gray-100">智慧加餐:</strong> 当感到饥饿时，选择健康的零食。例如：一小把坚果、一个苹果、一盒无糖酸奶、一根黄瓜。</li>
                    </ul>
                </SubSection>
                <hr className="my-4 border-gray-200 dark:border-gray-700"/>
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
                <p className="font-bold mt-2 text-indigo-500">专业提示：从准备3天的午餐开始，慢慢找到适合自己的节奏。</p>
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
