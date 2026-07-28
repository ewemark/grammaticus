// Auto-generated from HTML grammar chapters
// Generated: 2026-07-28T10:59:23.450Z

export interface GrammarBlock {
  type: 'h2' | 'h3' | 'h4' | 'p' | 'larry' | 'tip' | 'warn' | 'point' | 'summary' | 'exercise' | 'example' | 'list' | 'table'
  text?: string
  en?: string
  cn?: string
  items?: string[]
  headers?: string[]
  rows?: string[][]
}

export interface GrammarChapter {
  id: string
  order: number
  title: string
  subtitle: string
  intro: string
  blocks: GrammarBlock[]
}

export const GRAMMAR_CHAPTERS: GrammarChapter[] = [
  {
    "id": "parts-of-speech",
    "order": 1,
    "title": "换一种方式理解词性",
    "subtitle": "Parts of Speech Reimagined",
    "intro": "这一章要讲的东西，如果你真的吃透了，后面六章会变得无比轻松。如果你没吃透，后面每一步都会觉得\"规则好多，背不下来\"。…",
    "blocks": [
      {
        "type": "p",
        "text": "这一章要讲的东西，如果你真的吃透了，后面六章会变得无比轻松。如果你没吃透，后面每一步都会觉得\"规则好多，背不下来\"。"
      },
      {
        "type": "p",
        "text": "我们要做一件传统语法书从来不做的事：不从\"十大词性\"开始讲，而是从\"修饰关系\"开始讲。你会发现，语法规则不是一堆需要硬背的清单—它们都是从同一个简单的原理推导出来的：句子里的每一个词，要么是被修饰的东西，要么是修饰别人的东西。"
      },
      {
        "type": "p",
        "text": "学完这一章，你应该能够：看一眼任何一个简单的英语句子，立刻说出每个词在修饰谁、扮演什么角色。这个能力是后面分析长难句的基础。"
      },
      {
        "type": "h3",
        "text": "1.1 什么是\"词性\"为什么要学它？"
      },
      {
        "type": "p",
        "text": "在开始之前，我们需要先搞清楚一个最基本的问题：什么是\"词性\"？"
      },
      {
        "type": "p",
        "text": "简单说，词性 = 一个词在句子里扮演的\"角色\"。"
      },
      {
        "type": "p",
        "text": "就像一部电影里有主角、配角、群众演员一样，一个句子里也有各种不同的角色。有些词负责\"命名\"（比如哪些人、什么东西），有些词负责\"描述\"（长什么样、怎么做的），有些词负责\"连接\"（把一个东西和另一个东西串起来）。同一个演员可以在不同的电影里演不同的角色—同一个词也可以在不同的句子里扮演不同的角色。"
      },
      {
        "type": "example",
        "en": "I have a fast car. → fast 在描述 car 是什么样子（修饰名词）",
        "cn": "同一个词 fast，在第一个句子里扮演\"形容词\"的角色，在第二个句子里扮演\"副词\"的角色。它不是天生就属于某个词性—它的词性取决于它在这个句子里干了什么活。"
      },
      {
        "type": "tip",
        "text": "核心概念：问一个孤立的词「你是什么词性？」是不对的。正确的问题是：「你在这个句子里修饰谁？」"
      },
      {
        "type": "p",
        "text": "传统语法教材从\"十大词性\"开始讲：名词、动词、形容词、副词、介词、连词、代词、冠词、数词、感叹词。学生被告知要逐一背诵它们的定义和特征。但 Larry 的方式完全不同—他让你只需要理解三种核心角色，其余的自然就推导出来了。"
      },
      {
        "type": "larry",
        "text": "同学们，语法不是用来背的。如果你需要靠背诵来学语法，那你一定是学错了。语法是用来理解的—你一旦理解了最底层的那个原理，所有的规则都变成了自然而然的事。"
      },
      {
        "type": "h3",
        "text": "1.2 名词性成分—给世上的一切命名"
      },
      {
        "type": "h4",
        "text": "1.2.1 什么是名词性成分？"
      },
      {
        "type": "p",
        "text": "想象一下，你站在一个空旷的房间里，房间里什么都有，但一切事物都还没有名字。你开始给它们起名字：这个坐的东西叫\"chair\"（椅子），那个发光的东西叫\"sun\"（太阳），那种让人想靠近的感觉叫\"love\"（爱）。你每给一样东西起一个名字，你就创造了一个名词。"
      },
      {
        "type": "list",
        "items": [
          "名词性成分的作用就是给句子提供\"参与者\"—它回答\"谁\"和\"什么\"这两个问题。谁是动作的发出者？",
          "（主语）动作落在了谁/什么身上？",
          "（宾语）被描述的东西是谁/什么？"
        ]
      },
      {
        "type": "point",
        "text": "名词性成分可以表示的四大类事物：\n\n类别你可以指着问…大量示例\n人\"这是谁？\"teacher, student, doctor, mother, baby, Tom, the president, a stranger, my friend\n物 / 动植物\"这是什么？\"book, water, car, tree, dog, phone, coffee, air, a desk, the moon\n地点\"这是哪里？\"Beijing, school, park, kitchen, the beach, the universe, my home\n抽象概念\"这叫什么？\"love, freedom, happiness, idea, knowledge, time, truth, justice, beauty, courage"
      },
      {
        "type": "p",
        "text": "注意第四类—抽象概念。你不能指着空气说\"这是 love\"，但 love 确实是一个可以拿来讨论的\"东西\"。在英语里，只要一个概念可以作为句子描述的对象，它就是名词性的。"
      },
      {
        "type": "h4",
        "text": "1.2.2 名词性成分在句子里做什么？"
      },
      {
        "type": "p",
        "text": "一个名词性成分出现在句子中的位置，决定了它扮演的具体角色。理解这些角色很重要，因为第二章讲简单句结构时会频繁用到这些概念。"
      },
      {
        "type": "point",
        "text": "名词性成分在句中的五种主要角色：\n\n角色说明示例怎么找到它\n主语句子要\"讨论的对象\"；动作的发出者Birds fly.问：谁/什么东西 + 动词？→ 谁在飞？Birds\n宾语动作的\"承受者\"I love music.问：动词 + 谁/什么？→ 爱什么？music\n补语跟在 be/系动词后，说明主语\"是什么\"He is a teacher.问：主语是什么/怎么样？→ 他是老师\n介词宾语跟在介词（in/on/at等）后面on the desk问：介词 + 什么？→ 在什么上面？桌子\n同位语放在另一个名词后面，解释它My friend Tom is here.问：前面的名词具体是谁/什么？→ Tom"
      },
      {
        "type": "example",
        "en": "Tom gave Mary a book.",
        "cn": "一个句子里可以同时出现三个名词性成分：Tom（主语，谁给的），Mary（间接宾语，给了谁），a book（直接宾语，给了什么）。每个都在扮演不同的角色。"
      },
      {
        "type": "example",
        "en": "The capital of China is Beijing.",
        "cn": "capital（主语），China（介词 of 的宾语），Beijing（补语）—这三个位置填的都是名词性成分。"
      },
      {
        "type": "h4",
        "text": "1.2.3 可数与不可数：本质是\"有没有天然的边界\""
      },
      {
        "type": "p",
        "text": "很多语法书告诉你：可数名词是\"可以数出个数的东西\"，不可数名词是\"不能数的东西\"。这个解释不完全错，但它没有触及问题的本质，而且会让你产生很多困惑：水不能数吗？我可以数\"一杯水、两杯水\"啊。经验不能数吗？我可以感叹\"我有三段不同的工作经历\"啊。"
      },
      {
        "type": "p",
        "text": "所以真正的区分标准不是\"能不能数\"，而是：这个东西在人的认知里，有没有一个天然的\"边界\"。"
      },
      {
        "type": "point",
        "text": "可数名词：在概念上有\"天然边界\"的东西。\n\n一本书是一个独立的个体—它和旁边的另一本书之间有明确的物理边界。一个人是一个独立的个体。一座城市、一个苹果、一部手机—你不需要任何额外的工具，就能指出\"这是一个\"和\"那是另一个\"。\n\na book, a person, a city, an apple, a phone, a car, a tree, a chair\n\n因为这些词指代的个体之间天然有边界，英语就给它们配了单复数形式：one book, two books。单数时必须加 a/an 或 the，因为你必须标记\"我说的是一个\"。\n\n不可数名词：在概念上没有\"天然边界\"的东西。\n\n水有边界吗？你把一杯水倒进河里，它和河里的水融为一体了。你说\"一块水\"？水没有天然的形状。你说\"一块知识\"？知识不是一个有形状、可以单独取出来的物体。你说\"一件设备\"？equipment 这个词指的是一个笼统的类别，而不是单个物体。\n\nwater, air, sand, rice, knowledge, information, advice, equipment, furniture, music, time\n\n因为这些词指代的东西在概念上没有自然的\"个\"的边界，英语就不给它们配复数形式—你不能说 two knowledges，不能说 three furnitures。你要数它们，必须人为地加一个\"容器词\"（量词）：a glass of water, a piece of advice, an item of furniture。"
      },
      {
        "type": "tip",
        "text": "一个实用的思维方式：不要死记\"water 是不可数的\"。你要理解的是：water 指的是一类物质，在英语的认知里，这类物质没有\"天然的块/个/片\"。所以英语不允许你说 a water（指物质本身）。如果你在餐厅听到有人说 \"Can I have a water?\"，他省略了单位词—完整的说法是 \"a glass of water\" 或 \"a bottle of water\"。在口语中这种省略很常见，但你要知道省略了什么。"
      },
      {
        "type": "warn",
        "text": "为什么中国人特别容易搞错这些词？\n\n因为中文的思维习惯和英语不一样。中文里\"一条信息\"的\"条\"是量词，但核心概念\"信息\"在中文里既可以说\"一条信息\"也可以说\"很多信息\"。但英语里 information 本身没有复数，你不能说 informations。以下这些词在英语中都是不可数的—意味着你不能说 an X，也不能说 Xs：\n\ninformation（信息） | advice（建议） | furniture（家具） | news（新闻）\nequipment（设备） | luggage（行李） | weather（天气） | progress（进步）\nknowledge（知识） | research（研究） | evidence（证据） | traffic（交通）\n\n要表达\"一个/一条/一件\"，你必须加量词：\n\na piece of advice, a piece of furniture, a piece of news, a piece of equipment, a piece of luggage"
      },
      {
        "type": "point",
        "text": "同一个词，当它有\"边界\"（可数）和没有\"边界\"（不可数）时，意思完全不同：\n\n词没有边界 = 不可数有边界 = 可数为什么？\nglass玻璃（一种材料，没有天然边界）a glass = 一个杯子材料没有边界；杯子有边界（你可以拿起来一个）\npaper纸（材料）a paper = 一篇论文材料没有边界；一篇论文有边界（开头到结尾）\ntime时间（抽象流，没有边界）three times = 三次时间之流没有边界；\"次数\"有边界（一次就是一个完整的发生）\nroom空间a room = 一个房间空间没有边界；一个房间有四面墙（边界）\nexperience经验（累积的，没有边界）an experience = 一次经历累积的经验没有边界；一次经历有开头和结尾\nchicken鸡肉（食材）a chicken = 一只鸡食材没有边界；一只鸡是有边界的动物\n\n理解了这个表，你就不需要死记\"glass 既是可数又是不可数\"—你只需要问：它在这个句子里指代的是\"有边界的东西\"还是\"没有边界的物质或概念\"？"
      },
      {
        "type": "h4",
        "text": "1.2.4 最重要的一个洞见：一句话也可以变成名词性成分"
      },
      {
        "type": "larry",
        "text": "这是整个第一章里最重要的一个观点，也是这门课最有价值的一句话。很多人学了十年英语都只知道「名词 = 单个的词」，比如 book、water、love。但你有没有想过：如果一句话也能当名词用呢？「他迟到了」—这是一个完整的句子，对吧？但在英语里，我可以在它前面加个 that，变成「That he is late」，然后把它当作一个名词，放到主语位置：「That he is late surprised me.」—「他迟到这件事，让我很惊讶。」一个完整的句子，就这样变成了一个名词性成分。"
      },
      {
        "type": "p",
        "text": "\"名词性\"不是一个词的类型，而是一个功能的名称。任何东西—一个单词、一个短语、甚至一句完整的话—只要它在更大的句子里做了主语、宾语、补语这些\"名词该干的活\"，它就是名词性的。"
      },
      {
        "type": "point",
        "text": "名词性成分的四个层级（从简单到复杂）：\n\n层级形式示例在句中的作用\n① 单个单词名词 / 代词Books are my friends.一个单词做主语\n② 短语动名词短语\n不定式短语Reading books is my hobby.\nI want to go home.几个词一起，整体当名词用\n③ 一整句话名词性从句That he lied is obvious.一个完整的句子，整体当名词用"
      },
      {
        "type": "example",
        "en": "That the earth is round is a fact.",
        "cn": "\"That the earth is round\"（地球是圆的）是一句完整的话（有自己的主语 the earth 和谓语 is）。加上 that 之后，这整句话变成了一个名词性成分，充当主句的主语。—你不需要等到第三章才接触这个概念，你在这里就已经见过了。"
      },
      {
        "type": "example",
        "en": "I know (that) you are right.",
        "cn": "\"you are right\"（你是对的）是一句完整的话，作为 know 的宾语。"
      },
      {
        "type": "tip",
        "text": "这个洞见是理解第三章名词性从句的关键。从句不是什么神秘的新东西—它就是「把一句完整的话当名词来用」。你在第一章就已经理解了它的本质。"
      },
      {
        "type": "h3",
        "text": "1.3 形容词性成分—描绘名词的特征"
      },
      {
        "type": "h4",
        "text": "1.3.1 什么是形容词性成分？"
      },
      {
        "type": "p",
        "text": "名词告诉你是谁、是什么。但光有名词不够—你想知道这个东西是什么样子的。这就是形容词性成分的工作：修饰名词，告诉你这个名词的特征、属性、状态。"
      },
      {
        "type": "p",
        "text": "一个简单的测试：在任何名词前面加一个\"什么样的\"，回答它的那个词就是形容词性成分。"
      },
      {
        "type": "example",
        "en": "a beautiful flower → 什么样的花？美丽的",
        "cn": ""
      },
      {
        "type": "h4",
        "text": "1.3.2 形容词性成分放在哪里？"
      },
      {
        "type": "point",
        "text": "位置一：放在名词前面（前置定语）\na happy child单个形容词直接放在名词前\na beautiful young lady多个形容词可以连续修饰同一个名词\nan old wooden chair形容词的顺序有讲究：主观评价（old）在前，客观属性（wooden）在后\n\n位置二：放在系动词后面（后置补语）\nThe child is happy.is 是系动词，happy 放在 is 之后，说明 child 的状态\nThe soup smells delicious.smells 是感官系动词，说明 soup 闻起来怎么样\nHe became angry.became 是变化系动词，说明 he 变成了什么状态"
      },
      {
        "type": "h4",
        "text": "1.3.3 形容词性成分不只是单词"
      },
      {
        "type": "larry",
        "text": "很多人一提形容词，脑子里只有\"beautiful, tall, happy\"这些单个的词。但你有没有想过：如果一个介词短语也能修饰名词呢？如果一个句子也能像形容词一样去修饰一个名词呢？—这正是后面章节要讲的东西。但你现在就要有这个意识：形容词性是一种功能，不是一种词类。"
      },
      {
        "type": "point",
        "text": "四种可以充当形容词性角色的东西：\n\n形式示例谁在被修饰？\n① 单个形容词a red applered 修饰 apple\n② 介词短语the book on the desk\"on the desk\" 修饰 book，告诉你\"哪本书\"\n③ 分词短语the boy standing there\"standing there\" 修饰 boy，告诉你\"哪个男孩\"\n④ 一整个句子the man who came yesterday\"who came yesterday\" 是一句话，修饰 man"
      },
      {
        "type": "example",
        "en": "The girl in the red dress is my sister.",
        "cn": "\"in the red dress\" 不是一个单词，而是一个介词短语。但它的功能和 beautiful 一模一样：修饰 girl，告诉你\"哪个女孩\"。"
      },
      {
        "type": "h3",
        "text": "1.4 副词性成分—描绘动作的特征"
      },
      {
        "type": "h4",
        "text": "1.4.1 什么是副词性成分？"
      },
      {
        "type": "p",
        "text": "形容词修饰名词。那如果我想修饰不是名词的东西—比如一个动词、一个形容词、甚至整个句子—我用什么？"
      },
      {
        "type": "p",
        "text": "答案：副词性成分。"
      },
      {
        "type": "p",
        "text": "这是一个极其简洁的定义：副词 = 修饰任何不是名词的东西。如果形容词的职责是描述\"名词长什么样\"，那副词的职责就是描述\"动作怎么发生、状态到什么程度、事情发生在何时何地\"。"
      },
      {
        "type": "point",
        "text": "副词回答的五类问题：\n\n问题示例分析\n怎样做的？（方式）She speaks slowly.slowly 告诉你她说话的方式\n什么时候？（时间）He arrived yesterday.yesterday 告诉你到达的时间\n在哪里？（地点）She is sitting there.there 告诉你坐的位置\n到什么程度？（程度）I completely agree.completely 告诉你同意的程度\n多久一次？（频率）He often visits us.often 告诉你访问的频率"
      },
      {
        "type": "h4",
        "text": "1.4.2 副词性成分可以修饰哪些东西？"
      },
      {
        "type": "point",
        "text": "修饰对象一：动词（最常见）\nThe children played happily in the park.happily 修饰 played → 怎么玩的？开心地\nHe finally understood.finally 修饰 understood → 什么时候理解的？最终\nShe seldom watches TV.seldom 修饰 watches → 多久看一次？很少\n\n修饰对象二：形容词\nThis is extremely important.extremely 修饰 important → 重要到什么程度？极其\nThe soup is too hot.too 修饰 hot → 太烫了\n\n修饰对象三：另一个副词\nShe runs very fast.very 修饰 fast（副词）→ 快到什么程度？非常\nHe speaks quite well.quite 修饰 well（副词）→ 相当好\n\n修饰对象四：整个句子\nFortunately, no one was hurt.\"幸好在\"—这是说话人对整件事的评价，不是修饰某个词\nObviously, he is lying.\"显然\"—说话人的判断语气"
      },
      {
        "type": "h4",
        "text": "1.4.3 形容词和副词：其实是同一个东西"
      },
      {
        "type": "p",
        "text": "这是本章最重要的一个结论，也是 Larry 整个语法体系的核心洞见："
      },
      {
        "type": "example",
        "en": "She is a careful driver.",
        "cn": "careful（形容词形式）修饰名词 driver"
      },
      {
        "type": "example",
        "en": "She drives carefully.",
        "cn": "carefully（副词形式）修饰动词 drives"
      },
      {
        "type": "example",
        "en": "He is a quick learner. → He learns quickly.",
        "cn": ""
      },
      {
        "type": "example",
        "en": "a beautiful song → She sings beautifully.",
        "cn": ""
      },
      {
        "type": "example",
        "en": "a fluent speaker → He speaks fluently.",
        "cn": ""
      },
      {
        "type": "tip",
        "text": "终极公式：形容词和副词是同一种东西—「修饰语」。唯一的区别是修饰的对象不同。修饰名词 → 形容词的形式；修饰非名词 → 副词的形式。"
      },
      {
        "type": "warn",
        "text": "特别注意：有些词形态不变，既能当形容词又能当副词。判断它是什么，唯一的方法就是看它修饰谁：\n\na fast car → fast 修饰 car（名词）→ 形容词\n\ndrive fast → fast 修饰 drive（动词）→ 副词\n\na hard problem → hard 修饰 problem → 形容词\n\nwork hard → hard 修饰 work → 副词"
      },
      {
        "type": "h3",
        "text": "1.5 词性之间的修饰关系"
      },
      {
        "type": "larry",
        "text": "你如果能一眼看出一个句子中谁在修饰谁，你的语法就已经超过了90%的英语学习者。词性不是靠背的，是靠\"看关系\"看出来的。"
      },
      {
        "type": "h4",
        "text": "1.5.1 三层修饰：单词、短语、从句"
      },
      {
        "type": "p",
        "text": "在 1.2-1.4 节我们讲的都是单个单词的修饰关系—一个形容词修饰一个名词，一个副词修饰一个动词。但在实际英语中，修饰关系有三种规模："
      },
      {
        "type": "point",
        "text": "修饰关系的三层级：\n\n规模修饰名词（形容词性）修饰非名词（副词性）\n单词级a red applerun quickly\n短语级the book on the deskarrived at noon\n从句级the man who came yesterdayleft because he was tired\n\n短语级和从句级的内容会在后面的章节详细展开。但你现在就需要理解：无论规模大小，修饰关系只有两种—修饰名词（起形容词作用），修饰非名词（起副词作用）。"
      },
      {
        "type": "h4",
        "text": "1.5.2 同一个词，在不同位置，可以有不同的词性"
      },
      {
        "type": "p",
        "text": "这是\"先看关系、再定词性\"原则的最佳体现。同一个词 fast，在不同的句子中可以扮演完全不同的角色。你不应该先入为主地说\"fast 是形容词\"—你应该问\"fast 在这个句子里修饰谁？\""
      },
      {
        "type": "example",
        "en": "I have a fast car. → 修饰 car（名词）→ 形容词",
        "cn": ""
      },
      {
        "type": "example",
        "en": "Don't drive so fast. → 修饰 drive（动词）→ 副词",
        "cn": ""
      },
      {
        "type": "example",
        "en": "We work hard. → 修饰 work（动词）→ 副词",
        "cn": ""
      },
      {
        "type": "example",
        "en": "This is a hard problem. → 修饰 problem（名词）→ 形容词",
        "cn": ""
      },
      {
        "type": "tip",
        "text": "结论：先看关系，再定词性。永远不要脱离句子去判断一个词的词性。"
      },
      {
        "type": "exercise",
        "text": "练习 1.1：找出修饰语并判断词性\n\nThe very tall boy quickly ran to the old store.\nShe is an extremely careful driver.\nUnfortunately, he completely forgot the important meeting.\nThe young teacher patiently explained the difficult concept."
      },
      {
        "type": "h3",
        "text": "1.6 介词—把名词变成修饰语"
      },
      {
        "type": "h4",
        "text": "1.6.1 什么是介词？"
      },
      {
        "type": "p",
        "text": "介词的英文是 preposition：pre- 表示\"在前面\"，position 表示\"位置\"。所谓介词，就是放在名词前面的一个词，它把后面的名词和前面的内容连接起来，告诉读者两者之间是什么关系。"
      },
      {
        "type": "p",
        "text": "介词本身的含义不多—in 就是\"在…里面\"，on 就是\"在…上面\"，from 就是\"从…\"。真正的语法价值在于：介词 + 名词，这个组合整体变成了一个修饰语。"
      },
      {
        "type": "point",
        "text": "最常见的基础介词：\n\nin（在…里面）on（在…上面）at（在…点）by（在…旁边）\nwith（和…一起/用…）for（为了…）from（从…）to（向…）\nof（…的）about（关于…）between（在…之间）under（在…下面）"
      },
      {
        "type": "h4",
        "text": "1.6.2 介词短语只有两种用途"
      },
      {
        "type": "p",
        "text": "这是理解介词最关键的洞见：\"介词 + 名词\"形成的介词短语，在句子中只做两件事—要么当形容词用（修饰名词），要么当副词用（修饰动词）。没有第三种可能。"
      },
      {
        "type": "point",
        "text": "用途一：修饰名词（形容词性 / 作定语）\nThe book on the desk is mine.\"on the desk\" 告诉你哪本书 → 修饰名词 book → 形容词性\nThe girl in the red dress is my sister.\"in the red dress\" 告诉你哪个女孩 → 修饰名词 girl → 形容词性\nI like the house with a big garden.\"with a big garden\" 告诉你什么样的房子 → 修饰名词 house → 形容词性\n\n用途二：修饰动词（副词性 / 作状语）\nHe arrived at noon.\"at noon\" 告诉你什么时候到的 → 修饰动词 arrived → 副词性\nShe sat on the chair.\"on the chair\" 告诉你坐在哪里 → 修饰动词 sat → 副词性\nWe talked about the plan.\"about the plan\" 告诉你谈论了什么 → 修饰动词 talked → 副词性"
      },
      {
        "type": "h4",
        "text": "1.6.3 一个快速判断法"
      },
      {
        "type": "p",
        "text": "看到任何介词短语，问自己两个问题：\n\nQ1：它在谁的前面/后面？→ 找到它修饰的对象\n\nQ2：这个对象是名词还是动词？→ 名词 → 形容词性；动词 → 副词性"
      },
      {
        "type": "exercise",
        "text": "练习 1.2：判断介词短语的身份\n\nThe man in the corner is my boss.\nShe put the keys on the table.\nI go to school by bus every day.\nThe letter from my mother made me cry."
      },
      {
        "type": "summary",
        "text": "第一章总结\n这一章你不需要记住任何\"规则清单\"。你只需要理解一个东西：句子里的每一个成分，要么是被修饰的（名词性的），要么是修饰别人的（形容词性或副词性的）。\n\n名词性 = 东西本身（谁、什么）\n\n形容词性 = 修饰名词（什么样子的）\n\n副词性 = 修饰非名词（怎么样的、何时何地、什么程度）\n\n介词短语、从句、非谓语动词—后面章节要讲的所有东西—它们的本质都是在不同规模上重复这三种角色。你在这里理解了这个框架，后面所有章节都是它的展开。"
      }
    ]
  },
  {
    "id": "simple-sentences",
    "order": 2,
    "title": "一个句子是怎么搭建起来的——简单句",
    "subtitle": "Simple Sentences",
    "intro": "在第一章里，你学会了看一个词的\"角色\"—它是名词性的（被修饰的），还是形容词性或副词性的（修饰别人的）。但要想真正理解一个句子，光看单个词还不够。你需要知道这些词是怎么组合成一个有意义的句子的。…",
    "blocks": [
      {
        "type": "p",
        "text": "在第一章里，你学会了看一个词的\"角色\"—它是名词性的（被修饰的），还是形容词性或副词性的（修饰别人的）。但要想真正理解一个句子，光看单个词还不够。你需要知道这些词是怎么组合成一个有意义的句子的。"
      },
      {
        "type": "p",
        "text": "这一章要解决的核心问题是：一个英语句子，最少需要哪些部件？每个部件在干什么？这些部件有几种组合方式？"
      },
      {
        "type": "p",
        "text": "不管一个句子有多长、多复杂—从最简单的 \"Birds fly.\" 到一页纸都写不下的长句—它的\"骨架\"一定属于本章要讲的五种基本结构之一。你学会了拆骨架，再长的句子都不怕。"
      },
      {
        "type": "h3",
        "text": "2.1 一个句子的最小单位：主语 + 谓语"
      },
      {
        "type": "h4",
        "text": "2.1.1 句子是什么？"
      },
      {
        "type": "p",
        "text": "在第一章，你接触过\"主语\"和\"谓语\"这两个词，但我们没有深入解释。现在正式来讲。"
      },
      {
        "type": "p",
        "text": "一个句子，本质上就是用语言描述了一件事。这件事需要两个基本信息才能成立：一个\"主角\"（谁/什么东西）和关于这个主角的\"陈述\"（它做了什么 / 它是怎样的）。"
      },
      {
        "type": "example",
        "en": "Birds fly.",
        "cn": "主角 = Birds（谁？鸟）。陈述 = fly（鸟怎么样了？飞）。\"鸟飞\"—一个完整的意思。"
      },
      {
        "type": "p",
        "text": "英语把\"主角\"叫做主语（Subject），把\"关于主角的陈述\"叫做谓语（Predicate）。主语 + 谓语，是一个英语句子成立的最基本条件。"
      },
      {
        "type": "point",
        "text": "主语的本质：主语是句子要讨论的对象。它回答\"谁\"或\"什么\"—谁是动作的发出者？谁是句子要描述的东西？主语必须是名词性的东西（一个名词、一个代词、或者任何能当名词用的结构）。\n\n谓语的本质：谓语是对主语做出的陈述。它一定包含一个有时态变化的动词（这个动词叫\"谓语动词\"）。谓语回答\"主语做了什么\"或者\"主语是怎样/是什么\"。"
      },
      {
        "type": "example",
        "en": "The baby cried.",
        "cn": "主语：The baby（谁？婴儿）。谓语：cried（婴儿怎么样了？哭了）。"
      },
      {
        "type": "example",
        "en": "She is a doctor.",
        "cn": "主语：She（谁？她）。谓语：is a doctor（她是什么？是一名医生）。"
      },
      {
        "type": "example",
        "en": "The weather has been terrible.",
        "cn": "主语：The weather（什么？天气）。谓语：has been terrible（天气怎么样？一直很糟糕）。"
      },
      {
        "type": "tip",
        "text": "一个简单句有且只有一个\"主语—谓语\"组合。如果你看到一个句子里出现了两个带有时态变化的动词（比如 is 和 runs 同时出现），那说明这不是一个简单句，而是由多个简单句拼起来的复合句（第三章的内容）。"
      },
      {
        "type": "h3",
        "text": "2.2 让句子丰满起来：宾语"
      },
      {
        "type": "h4",
        "text": "2.2.1 为什么需要宾语？"
      },
      {
        "type": "p",
        "text": "\"Birds fly.\" 是一个完整的句子。在这个句子里，fly（飞）这个动作不需要落到任何别的东西上面—鸟自己在飞，飞就完了。这种不需要往外接东西的动词，叫做不及物动词。"
      },
      {
        "type": "p",
        "text": "但很多动作不是这样的。你说 \"I love.\"—爱谁？爱什么？句子没说完，听的人等着你补上。你需要一个东西来承受这个动作，这个东西就是宾语（Object）。"
      },
      {
        "type": "example",
        "en": "I love you.",
        "cn": "love（爱）需要一个承受者 → you 就是宾语。爱落到你身上了，句子完整了。"
      },
      {
        "type": "point",
        "text": "宾语的定义：宾语是谓语动词动作的承受者。它回答\"动作落在了谁/什么上面？\"。宾语必须是名词性的东西（名词、代词、或任何能当名词用的结构）。\n\n及物动词 vs 不及物动词：\n\n需要接宾语的动词 → 及物动词（transitive verb）：love, eat, buy, see, find, give…\n\n不需要接宾语的动词 → 不及物动词（intransitive verb）：fly, sleep, arrive, die, laugh, run…\n\n同一个动词可能既是及物又是不及物：She sings beautifully.（不及物） → She sings a song.（及物，song 是宾语）"
      },
      {
        "type": "example",
        "en": "He bought a new car.",
        "cn": "bought（买了）→ 买了什么？一辆新车。a new car 是宾语。"
      },
      {
        "type": "example",
        "en": "She is reading a book.",
        "cn": "is reading（正在读）→ 读什么？一本书。a book 是宾语。"
      },
      {
        "type": "warn",
        "text": "初学者最容易混淆的：把介词后面的名词当成宾语。\n\nI go to school. → to school 不是宾语！go 是不及物动词，to school 是修饰 go 的状语（去哪？去学校）。\n\n判断方法：把\"动词 + 后面的名词\"单独拿出来，能不能直接组成一个有意义的搭配？I go school？不行 → school 不是宾语。I bought a car？可以 → a car 是宾语。"
      },
      {
        "type": "h3",
        "text": "2.3 一种特殊的\"等号\"补语"
      },
      {
        "type": "h4",
        "text": "2.3.1 为什么还需要补语？"
      },
      {
        "type": "p",
        "text": "到现在为止，你已经知道了一个句子可以有两种结构："
      },
      {
        "type": "list",
        "items": [
          "主语 + 谓语（Birds fly.）",
          "主语 + 谓语 + 宾语（I love you.）"
        ]
      },
      {
        "type": "list",
        "items": [
          "但请你看这句话：\"He is.\"—他是？",
          "句子不完整。你需要知道\"他是什么\"。再比如：\"She looks.\"—她看起来？",
          "看起来怎么样？",
          "同样不完整。"
        ]
      },
      {
        "type": "p",
        "text": "跟在 is / looks / became / seems 这类的动词后面、用来补全主语信息的成分，就是补语（Complement）。"
      },
      {
        "type": "example",
        "en": "He is a teacher.",
        "cn": "is 把 He 和 a teacher 画了一个等号：He = a teacher。a teacher 就是补语。"
      },
      {
        "type": "example",
        "en": "She looks tired.",
        "cn": "looks 把 She 和 tired 连起来了：She → tired。tired 就是补语。"
      },
      {
        "type": "point",
        "text": "补语的核心理解：补语跟在系动词后面，和主语之间形成一种\"等号\"或\"描述\"关系。\n\n系动词有哪些？系动词不是一个动词，而是一类功能—\"连接主语和补语\"。最常见的几组：\n\n① be 动词：am, is, are, was, were\n\n② 感官：look（看起来）, sound（听起来）, smell（闻起来）, taste（尝起来）, feel（感觉起来）\n\n③ 变化：become, get, turn, grow, go（变成）\n\n④ 保持：remain, stay, keep（保持）\n\n⑤ 似乎：seem, appear（似乎、显得）"
      },
      {
        "type": "example",
        "en": "The soup smells delicious.",
        "cn": "delicious 补语，说明 soup 闻起来的状态"
      },
      {
        "type": "example",
        "en": "He became angry.",
        "cn": "angry 补语，说明 he 变化后的状态"
      },
      {
        "type": "example",
        "en": "The plan seems good.",
        "cn": "good 补语，说明 plan 给人的印象"
      },
      {
        "type": "h4",
        "text": "2.3.2 补语的两张脸：主补与宾补"
      },
      {
        "type": "p",
        "text": "上面讲的都是主语补足语—补充的是主语。还有一种补语叫宾语补足语—补充的是宾语。它出现在某些特殊动词后面。"
      },
      {
        "type": "example",
        "en": "They elected him president.",
        "cn": "president 补充的是 him（宾语），不是 they（主语）。→ 宾补：him = president"
      },
      {
        "type": "example",
        "en": "The news made her happy.",
        "cn": "happy 补充的是 her → 宾补：her → happy"
      },
      {
        "type": "tip",
        "text": "怎么区分宾补和双宾语？在宾语和后面的成分之间加一个 be 动词：\n\nWe call him Tony. → him is Tony？✓ 说得通 → 宾补\n\nI gave him a book. → him is a book？✗ 说不通 → 双宾语（him 是间接宾语，a book 是直接宾语）"
      },
      {
        "type": "h3",
        "text": "2.4 句子的\"血肉\"定语与状语"
      },
      {
        "type": "h4",
        "text": "2.4.1 什么是定语？"
      },
      {
        "type": "p",
        "text": "主语、谓语、宾语、补语，构成了一个句子的骨架。\"The cat sat.\"—骨架完整，意思清楚。但你想知道\"什么样的猫\"吗？你想知道\"坐在哪里\"吗？"
      },
      {
        "type": "p",
        "text": "这种给名词添加额外信息的成分，就是定语（Attributive）。定语修饰名词，回答\"什么样的 / 哪一个 / 谁的\"。"
      },
      {
        "type": "example",
        "en": "The black cat sat.",
        "cn": "black 修饰 cat → 定语，告诉你\"什么样的猫\""
      },
      {
        "type": "point",
        "text": "定语的核心特征：\n\n① 定语永远和名词绑定—它修饰的对象一定是一个名词性成分。\n\n② 定语不是句子的必要成分—去掉定语，句子仍然成立。\"The black cat sat.\" → 去掉 black → \"The cat sat.\" 依然完整。\n\n③ 定语可以由多种形式充当（第一章已经预告过）：形容词、介词短语、分词、从句。"
      },
      {
        "type": "example",
        "en": "a beautiful garden → 形容词做定语",
        "cn": ""
      },
      {
        "type": "h4",
        "text": "2.4.2 什么是状语？"
      },
      {
        "type": "p",
        "text": "定语修饰名词，那修饰动词（或者修饰整个句子）的叫什么？叫状语（Adverbial）。"
      },
      {
        "type": "list",
        "items": [
          "状语回答关于动作的附加信息：这个动作是怎样发生的？",
          "何时发生的？",
          "在哪里发生的？",
          "为什么发生？",
          "到什么程度？"
        ]
      },
      {
        "type": "example",
        "en": "The cat sat quietly.",
        "cn": "quietly 修饰 sat → 状语（怎样坐的？安静地）"
      },
      {
        "type": "example",
        "en": "The cat sat on the mat.",
        "cn": "on the mat 修饰 sat → 状语（坐在哪里？垫子上）"
      },
      {
        "type": "example",
        "en": "The cat sat because it was tired.",
        "cn": "because... 修饰 sat → 状语（为什么坐？因为累了）"
      },
      {
        "type": "point",
        "text": "状语的核心特征：\n\n① 状语修饰动词或整个句子（不是修饰名词）。\n\n② 状语不是句子的必要成分，去掉后句子依然完整。\n\n③ 状语的位置比较灵活：Quietly, the cat sat. = The cat sat quietly. = The cat quietly sat.\n\n④ 状语同样可以由多种形式充当：副词、介词短语、分词、从句。"
      },
      {
        "type": "tip",
        "text": "定状区分一招制胜：看到一个修饰语，问\"它在修饰谁？\"→ 修饰名词 = 定语；修饰动词/句子 = 状语。这个规则和第一章的\"形容词性 vs 副词性\"完全对应。定语就是形容词性的，状语就是副词性的。"
      },
      {
        "type": "h3",
        "text": "2.5 五种基本句型：所有英语句子的骨架"
      },
      {
        "type": "p",
        "text": "现在你认识了句子的六个基本部件：主、谓、宾、补、定、状。你已经知道，前四个是\"骨架\"（必要成分），后两个是\"血肉\"（附加成分）。"
      },
      {
        "type": "p",
        "text": "如果你只保留骨架（去掉所有定语和状语），你会发现世界上所有的英语简单句，都属于以下五种结构之一："
      },
      {
        "type": "point",
        "text": "编号名称结构核心动词类型示例解释\n1主谓S + V不及物动词Birds fly.只有主语和谓语，没有宾语也没有补语\n2主谓宾S + V + O及物动词I love you.动作有承受者（宾语）\n3主谓补S + V + C系动词She is happy.动词是系动词，补语说明主语\n4主谓宾宾S + V + O + O双宾动词I gave him a book.动词后面接了两个宾语（间接宾语 + 直接宾语）\n5主谓宾补S + V + O + C宾补动词We call him Tom.宾语后面有补语，补充说明宾语"
      },
      {
        "type": "p",
        "text": "你不必立即背诵这张表。用下面五个例句体会一下每种句型的感觉："
      },
      {
        "type": "example",
        "en": "句型1：The sun rises.",
        "cn": "太阳升起。rise 是不及物动词，不需要宾语。"
      },
      {
        "type": "example",
        "en": "句型2：She bought a dress.",
        "cn": "她买了一条裙子。buy 是及物动词，a dress 是宾语。"
      },
      {
        "type": "example",
        "en": "句型3：He is a student.",
        "cn": "他是学生。is 是系动词，a student 是补语。"
      },
      {
        "type": "example",
        "en": "句型4：She sent me an email.",
        "cn": "她给我发了一封邮件。me 间接宾语，an email 直接宾语。"
      },
      {
        "type": "example",
        "en": "句型5：I find the movie boring.",
        "cn": "我觉得这部电影无聊。boring 补充说明 the movie（宾语）。"
      },
      {
        "type": "h3",
        "text": "2.6 三步法：学会分析任何简单句"
      },
      {
        "type": "larry",
        "text": "语法分析不是学术游戏，它是让你真正理解一个句子在说什么的实用技能。你需要的不是一个复杂的方法论，而是一个简单到不能再简单的流程。"
      },
      {
        "type": "point",
        "text": "Larry 的三步分析法：\n\n第①步：找谓语。先找到句子中有时态变化的动词。一个简单句只有一个谓语动词。找到了谓语，你就找到了句子的发动机。\n\n第②步：找主干。从谓语往前找主语（谁在做这个动作？）。从谓语往后找宾语或补语（动作落在了谁身上？还是补充说明了主语？）。确定这个句子是五种句型中的哪一种。\n\n第③步：找修饰。剩下的所有成分都是定语或状语。问每一个修饰语：它在修饰名词（定语）还是修饰动词/句子（状语）？"
      },
      {
        "type": "p",
        "text": "来看一个完整的分析示例："
      },
      {
        "type": "example",
        "en": "The young student quietly reads an interesting book in the library every evening.",
        "cn": "第①步 找谓语：reads（有时态：一般现在时，第三人称单数）\n\n第②步 找主干：\n\n主语：往前找 → student（谁在读？学生）\n\n谓语：reads\n\n宾语：往后找 → book（读什么？书）\n\n→ 句型2: S + V + O (student reads book)\n\n第③步 找修饰：\n\nThe, young → 修饰 student → 定语\n\nan, interesting → 修饰 book → 定语\n\nquietly → 修饰 reads → 状语（怎么读的？）\n\nin the library → 修饰 reads → 状语（在哪里读的？）\n\nevery evening → 修饰 reads → 状语（什么时候读的？）"
      },
      {
        "type": "exercise",
        "text": "练习 2.1：三步分析法\n\nThe old man in the park feeds the birds every morning.\nComputers make our lives much easier.\nHer dream of becoming a doctor finally came true.\nI found the math problem extremely difficult."
      },
      {
        "type": "summary",
        "text": "第二章总结\n这一章讲了一个核心技能：看到任何英语句子，你能用三步法拆出它的骨架。\n骨架 = 五种句型之一：主谓 · 主谓宾 · 主谓补 · 主谓宾宾 · 主谓宾补\n\n血肉 = 定语（修饰名词）+ 状语（修饰动词/句子）\n这个能力是第三章从句分析的基础—因为每一个从句内部，本质上都是一个独立的小骨架。"
      }
    ]
  },
  {
    "id": "clauses",
    "order": 3,
    "title": "当一个句子去修饰另一个句子——从句",
    "subtitle": "Clauses",
    "intro": "在第二章，你学会了分析一个简单句的骨架。但真实世界里的英语不是由一个个孤立的简单句组成的—它是由简单句拼接出来的。把两个简单句连接到一起，让其中一个去修饰另一个，这就是本章要讲的从句。…",
    "blocks": [
      {
        "type": "p",
        "text": "在第二章，你学会了分析一个简单句的骨架。但真实世界里的英语不是由一个个孤立的简单句组成的—它是由简单句拼接出来的。把两个简单句连接到一起，让其中一个去修饰另一个，这就是本章要讲的从句。"
      },
      {
        "type": "p",
        "text": "在第一章 1.2.4 节，你已经见过\"一句话当名词用\"的例子（That he lied is obvious.）。现在我们要系统地学习：怎样把任何一句完整的话，变成另一个句子的主语、宾语、定语或状语。这不是新概念—这是你已经在做的事的自然延伸。"
      },
      {
        "type": "h3",
        "text": "3.1 两个简单句不能直接贴在一起"
      },
      {
        "type": "h4",
        "text": "3.1.1 逗号不能连接两个句子—逗号粘连\""
      },
      {
        "type": "p",
        "text": "请你读一下这句话："
      },
      {
        "type": "example",
        "en": "✗ I am tired, I will go to bed.",
        "cn": "这句话有什么问题？它把两个各自完整的简单句直接用逗号拼在了一起。中文可以这样说—\"我累了，我去睡觉了\"—但在英语里，这是语法错误（这叫\"流水句\" / run-on sentence）。"
      },
      {
        "type": "p",
        "text": "英语有一个毫不妥协的规则：两个各自有主谓结构的句子，不能直接放在一起。中间必须有一个\"连接词\"。"
      },
      {
        "type": "example",
        "en": "✓ I am tired, so I will go to bed.",
        "cn": "so 是连接词，告诉读者两个句子之间是因果关系。"
      },
      {
        "type": "example",
        "en": "✓ I left because I was tired.",
        "cn": "because 是连接词，后面的句子解释前面的句子。"
      },
      {
        "type": "p",
        "text": "这条规则看似简单，但它是理解一切从句的出发点。"
      },
      {
        "type": "h4",
        "text": "3.1.2 三种\"焊接方式\""
      },
      {
        "type": "point",
        "text": "方式用什么词关系示例\n并列and, but, or, so两个句子平等I came and I saw.\n从属 Ibecause, when, if…后面的句子说明前面的I left because I was tired.\n从属 IIwho, which, that…后面的句子修饰名词the book that I read\n\n后两种就是\"从句\"。从属 I → 状语从句，从属 II → 定语从句。"
      },
      {
        "type": "h4",
        "text": "3.1.3 从句 = 连词 + 简单句"
      },
      {
        "type": "p",
        "text": "从句内部的结构和你第二章学过的简单句一模一样。从句只是多了一个\"帽子\"—连接词。"
      },
      {
        "type": "example",
        "en": "[because] + [I was tired]",
        "cn": "帽子 = because + 内部 = 句型3（I + was + tired = SVC）"
      },
      {
        "type": "h3",
        "text": "3.2 名词性从句：一句完整的话当名词用"
      },
      {
        "type": "h4",
        "text": "3.2.1 概念"
      },
      {
        "type": "p",
        "text": "在任何一个名词可以去的位置（主语位、宾语位、补语位、同位语位），放一个完整的句子进去，前面加一个引导词。"
      },
      {
        "type": "point",
        "text": "位置示例理解\n主语位That he is late surprises me.\"他迟到\"整件事 = 主语\n宾语位I know that he is honest.\"他是诚实的\" = know 的宾语\n补语位The truth is that he lied.\"他撒了谎\" = truth 的内容\n同位语位The fact that he left shocked us.\"他离开了\" = 解释 fact"
      },
      {
        "type": "h4",
        "text": "3.2.2 引导词家族"
      },
      {
        "type": "p",
        "text": "that：仅起引导作用，没有含义。宾语从句中可省略：I know (that) he is right.\n\nwhether / if：表示\"是否\"。whether 可用在所有位置，if 只能用于宾语从句。\n\nwh-词（what, who, when, where, why, how）：本身有含义。"
      },
      {
        "type": "example",
        "en": "What she said is true.",
        "cn": "what = the thing that（主语从句）"
      },
      {
        "type": "example",
        "en": "I don't know who did it.",
        "cn": "宾语从句"
      },
      {
        "type": "warn",
        "text": "高频陷阱：从句内部永远用陈述句语序。\n\n✗ I don't know what does he want.\n\n✓ I don't know what he wants."
      },
      {
        "type": "exercise",
        "text": "练习 3.1\n\n_____ she said surprised everyone. (What / That)\nThe problem is _____ we don't have enough time. (that / what)"
      },
      {
        "type": "h3",
        "text": "3.3 形容词性从句（定语从句）"
      },
      {
        "type": "h4",
        "text": "3.3.1 概念"
      },
      {
        "type": "p",
        "text": "在第一章你知道了形容词修饰名词。如果一句话也能修饰名词呢？"
      },
      {
        "type": "example",
        "en": "the man who came yesterday",
        "cn": "\"who came yesterday\" 整个句子修饰 man → 像形容词一样，但它是一句话。"
      },
      {
        "type": "h4",
        "text": "3.3.2 关系词的选择"
      },
      {
        "type": "p",
        "text": "选哪个关系词，看两件事：先行词是人还是物？关系词在从句里当什么成分？"
      },
      {
        "type": "point",
        "text": "关系词先行词在从句中示例\nwho人主语the girl who smiled\nwhom人宾语the girl whom I met\nwhich物主语/宾语the book which I read\nthat人/物主语/宾语the book that I read\nwhose人/物定语the man whose car\nwhen时间状语the day when we met\nwhere地点状语the place where I live"
      },
      {
        "type": "tip",
        "text": "核心方法：把关系词替换回先行词读从句。\n\nthe book that I read → I read the book ← 通了！that = read 的宾语"
      },
      {
        "type": "h4",
        "text": "3.3.3 限定性 vs 非限定性"
      },
      {
        "type": "point",
        "text": "限定性（无逗号）：锁定是\"哪一个\"，不能去掉。\n\nMy brother who lives in Beijing is a doctor. → 不止一个兄弟\n\n非限定性（有逗号）：补充信息，可以去掉。不能用 that。\n\nMy brother, who lives in Beijing, is a doctor. → 只有一个兄弟"
      },
      {
        "type": "exercise",
        "text": "练习 3.2\n\nThis is the house _____ I was born. (where / which)\nThe man _____ car was stolen called the police. (whose / who)\nMy mother, _____ is 60, still works. (who / that)"
      },
      {
        "type": "h3",
        "text": "3.4 副词性从句（状语从句）"
      },
      {
        "type": "h4",
        "text": "3.4.1 概念"
      },
      {
        "type": "p",
        "text": "状语从句是三种从句里最直白的一种，因为引导词本身就告诉了你逻辑关系—because 就是\"因为\"，when 就是\"当…的时候\"，if 就是\"如果\"。你几乎不需要像定语从句那样去分析关系词在从句里当什么成分—状语从句修饰的是整个主句（或主句的谓语动词），而不是某个名词。"
      },
      {
        "type": "h4",
        "text": "3.4.2 九大类型状语从句"
      },
      {
        "type": "point",
        "text": "第一类：时间状语从句（when / while / before / after / until / since / as soon as）\n告诉读者主句的动作是什么时候发生的。\nWhen I arrived, he had already left.我到达的时候，他已经走了。when 从句说明\"到达\"和\"离开\"的时间先后。\nI'll wait until you come back.我会一直等到你回来。until 强调\"持续到某个时间点\"。\nAs soon as he saw me, he smiled.他一看到我就笑了。as soon as = 一…就…。\n\n第二类：原因状语从句（because / since / as）\nI left early because I was tired.because 是最常用的原因连词，语气最强。\nSince everyone is here, let's begin.since = \"既然\"，语气比 because 轻，常用于对方已经知道的原因。\n\n第三类：条件状语从句（if / unless / as long as）\nIf it rains tomorrow, we'll cancel the trip.if = 如果—这是最常见的条件句。\nYou won't pass unless you study.unless = if not（除非/如果不）。这句话 = You won't pass if you don't study.\n\n第四类：让步状语从句（although / though / even though）\nAlthough he is rich, he is unhappy.虽然他很富有，但他不快乐。\"虽然…但是…\"的逻辑，但英语只用 although，不用 but。\nEven though it was raining, they went out.even though = 即便（比 although 语气更强）\n\n第五类：目的状语从句（so that / in order that）\nSpeak louder so that everyone can hear you.so that = 为了/以便—说明主句动作的目的。\n\n第六类：结果状语从句（so…that / such…that）\nHe was so tired that he fell asleep immediately.他累得立刻睡着了。\"so + 形容词 + that + 结果\"\nIt was such a good movie that I watched it twice.\"such + 名词 + that + 结果\"\n\n第七类：比较状语从句（than / as…as）\nShe is taller than I am.\nHe runs as fast as his brother does.\n\n第八类：方式状语从句（as / as if / as though）\nDo as I say.照我说的做。as = 按照…的方式。\nHe talks as if he knew everything.他说话的样子好像他什么都知道。（实际上不是，所以用虚拟语气 knew）\n\n第九类：地点状语从句（where / wherever）\nStay where you are.待在你现在的地方别动。\nYou can sit wherever you like.你想坐哪儿就坐哪儿。"
      },
      {
        "type": "h4",
        "text": "3.4.3 两条必须记住的铁律"
      },
      {
        "type": "warn",
        "text": "铁律一：时间/条件从句中的\"主将从现\"\n\n当主句是将来时，时间和条件状语从句中不能用将来时，要用一般现在时代替。\n\n✗ When he will come, I will tell you.\n\n✓ When he comes, I will tell you.\n\n✗ If it will rain, we'll stay home.\n\n✓ If it rains, we'll stay home.\n\n这个规则为什么存在？因为英语把\"条件\"和\"时间\"当作已经确定的前提，而将来时表示不确定。前提是确定的，用现在时；结果是推测的，用将来时。"
      },
      {
        "type": "warn",
        "text": "铁律二：although 和 but 绝对不能同时出现\n\n中文的\"虽然…但是…\"可以同时出现，但英语里这两个词代表了两种互斥的语法机制：\n\nalthough = 从属连词（让一个句子附属于另一个）\n\nbut = 并列连词（让两个句子保持平等）\n\n一个从句不能同时用两种方式连接，所以：\n\n✗ Although he is rich, but he is unhappy.\n\n✓ Although he is rich, he is unhappy.\n\n✓ He is rich, but he is unhappy.\n\n选其中一种方式表达转折，不能两个都选。"
      },
      {
        "type": "h4",
        "text": "3.4.4 so…that 和 such…that 的公式"
      },
      {
        "type": "point",
        "text": "so + 形容词/副词 + that\nHe is so tall that he can touch the ceiling.\nShe ran so fast that no one could catch her.\n\nsuch + (a/an) + (形容词) + 名词 + that\nIt was such a good movie that I watched it twice.\nThey are such kind people that everyone loves them.\n\n记忆诀窍：so 后面永远直接跟形容词或副词；such 后面永远跟一个名词（可能带冠词和形容词）。\n\n特例：当名词前有 many / much / few / little（表示数量）时，用 so：\n\nso many books that… / so much money that… / so few people that…"
      },
      {
        "type": "exercise",
        "text": "练习 3.3：状语从句\n\nI'll call you as soon as I _____ (arrive).\n_____ he is young, he is very responsible. (选 Although / But)\nHe spoke _____ fast _____ I couldn't understand. (so…that / such…that)\nYou won't pass _____ you study harder. (if / unless)"
      },
      {
        "type": "summary",
        "text": "第三章总结\n\n从句 = 连词 + 简单句\n\n名词性从句 → 演名词 | 形容词性从句 → 演形容词 | 副词性从句 → 演副词\n\n把一二三章串起来：拆骨架（第二章）→ 找从句修饰关系（本章）→ 从句内部递归拆骨架。这个三层结构是你分析一切英语长句的工具。"
      }
    ]
  },
  {
    "id": "nonfinite-verbs",
    "order": 4,
    "title": "非谓语动词和从句是一回事",
    "subtitle": "Non-finite Verbs",
    "intro": "这是整套课程最具颠覆性的一章。Larry 提出了一个核心观点：非谓语动词本质上就是从句的\"压缩版\"。不定式、动名词、分词—每一样都可以还原为一个完整的从句。如果你第三章学好了，第四章就是\"降维打击\"。…",
    "blocks": [
      {
        "type": "p",
        "text": "这是整套课程最具颠覆性的一章。Larry 提出了一个核心观点：非谓语动词本质上就是从句的\"压缩版\"。不定式、动名词、分词—每一样都可以还原为一个完整的从句。如果你第三章学好了，第四章就是\"降维打击\"。"
      },
      {
        "type": "h3",
        "text": "4.1 不定式 (to do)"
      },
      {
        "type": "larry",
        "text": "不定式的核心含义就是\"还没发生的动作\"。to do 这个形式天然带有一种\"目标性、未来性、未完成性\"。理解了这三性，你就理解了不定式的所有用法。"
      },
      {
        "type": "h4",
        "text": "4.1.1 不定式的三种身份"
      },
      {
        "type": "point",
        "text": "身份1：名词（相当于名词性从句）\nTo learn English is not easy.做主语 → = That you learn English is not easy.\nI want to go home.做宾语 → = I want that I go home.（不自然，但逻辑等价）\nMy dream is to become a doctor.做补语 → = My dream is that I will become a doctor.\n\n身份2：形容词（相当于定语从句）\nI have work to do.修饰 work → = I have work that I must do.\nHe is the first person to arrive.修饰 person → = He is the first person who arrived.\n\n身份3：副词（相当于状语从句）\nI came to see you.修饰 came（目的）→ = I came so that I could see you.\nTo be honest, I don't like it.修饰整个句子（评注性状语）\nHe woke up to find the house empty.修饰 woke up（结果）→ = He woke up and found the house empty."
      },
      {
        "type": "h4",
        "text": "4.1.2 不定式的常见句型"
      },
      {
        "type": "point",
        "text": "it is + adj + (for/of sb) + to do:\n\nIt is important for you to be on time.\nIt is kind of you to help me.（of 用于表示人的品质：kind, nice, rude, clever, foolish…）\n\ntoo…to… / enough…to…:\n\nHe is too young to drive.太年轻以致不能开车\nShe is old enough to vote.足够大可以投票了\n\n疑问词 + to do:\n\nI don't know what to do.\nCan you tell me how to get there?"
      },
      {
        "type": "h3",
        "text": "4.2 动名词 (doing)"
      },
      {
        "type": "larry",
        "text": "动名词就是把一个动作变成名词。run 是\"跑\"，running 是\"跑步这件事\"。它只能当名词用—主语、宾语、补语、同位语—名词能去的地方它都能去。"
      },
      {
        "type": "h4",
        "text": "4.2.1 动名词 vs 不定式（作名词时）"
      },
      {
        "type": "p",
        "text": "这是最常见的考点。两者的核心区别不在规则，在时间感："
      },
      {
        "type": "point",
        "text": "动名词 (doing)不定式 (to do)\n时间感一般的、习惯性的、已经存在的动作概念未来的、具体的、尚未发生的动作\nenjoy / likeI enjoy swimming.（喜欢游泳这件事）I want to swim.（想去游泳这一次）\nrememberI remember locking the door.（记得锁过门）Remember to lock the door.（记得去锁门）\nforgetI forgot meeting her.（忘记见过她）I forgot to meet her.（忘记要去见她）\nstopStop talking.（停止说话）Stop to talk.（停下来去说话）\ntryTry taking this medicine.（试试吃这个药）Try to take this medicine.（设法/努力去吃药）"
      },
      {
        "type": "tip",
        "text": "Larry 说：不要死记哪些词后面接 doing 哪些接 to do。要理解—doing 是\"已经发生的/一般的动作概念\"，to do 是\"尚未发生的/具体的动作\"。你想想这个动作是\"已经存在\"还是\"尚未发生\"，自然就知道用哪个。"
      },
      {
        "type": "h4",
        "text": "4.2.2 动名词的其他用法"
      },
      {
        "type": "point",
        "text": "动名词的逻辑主语（所有格 + doing）：\nHis coming late surprised us.= That he came late surprised us.\nDo you mind my opening the window?\n\n介词 + 动名词：\nThank you for helping me.\nHe left without saying goodbye.\nI'm looking forward to hearing from you.（注意：这里的 to 是介词，后面接 doing，不是不定式！）"
      },
      {
        "type": "warn",
        "text": "高频陷阱：look forward to / be used to / object to 中的 to 是介词，后面接 doing，不是 do！\n\n✗ I'm looking forward to see you.\n\n✓ I'm looking forward to seeing you."
      },
      {
        "type": "h3",
        "text": "4.3 分词 (doing / done)"
      },
      {
        "type": "larry",
        "text": "分词就是\"动词穿上形容词或副词的外衣\"。现在分词（doing）= 主动 + 进行；过去分词（done）= 被动 + 完成。判断用 doing 还是 done，关键看名词和这个动作是什么关系：主动还是被动？"
      },
      {
        "type": "h4",
        "text": "4.3.1 分词作定语（= 定语从句的压缩）"
      },
      {
        "type": "point",
        "text": "现在分词（doing）= 主动/进行的定语从句：\nthe crying baby= the baby who is crying（婴儿在哭→主动+进行）\nthe man standing over there= the man who is standing over there\na promising future= a future that promises success\n\n过去分词（done）= 被动/完成的定语从句：\nthe broken window= the window that was broken（窗户被打破→被动+完成）\nthe language spoken in Brazil= the language that is spoken in Brazil\nfallen leaves= leaves that have fallen（落叶→主动但已完成）"
      },
      {
        "type": "h4",
        "text": "4.3.2 分词作状语（= 状语从句的压缩）"
      },
      {
        "type": "point",
        "text": "现在分词短语作状语：\nWalking home, I met an old friend.= While I was walking home, I met an old friend.（时间）\nNot knowing what to do, he asked for help.= Because he didn't know what to do…（原因）\nTurning left, you will see the bank.= If you turn left…（条件）\n\n过去分词短语作状语：\nDefeated, the army retreated.= After it was defeated, the army retreated.\nSeen from above, the city looks beautiful.= When it is seen from above…"
      },
      {
        "type": "warn",
        "text": "分词作状语的最大陷阱—逻辑主语一致：\n\n分词的逻辑主语必须是主句的主语。\n\n✗ Walking home, a dog bit me.（walking 的逻辑主语是 a dog？狗在走路？）\n\n✓ Walking home, I was bitten by a dog.（walking 的逻辑主语是 I）\n\n这种错误英语中叫\"悬垂分词\"（dangling participle），是写作中的硬伤。"
      },
      {
        "type": "h4",
        "text": "4.3.3 分词完成式 (having done / having been done)"
      },
      {
        "type": "p",
        "text": "当分词动作发生在主句动作之前时，用完成式："
      },
      {
        "type": "example",
        "en": "Having finished my homework, I went to bed.",
        "cn": "= After I had finished my homework, I went to bed."
      },
      {
        "type": "example",
        "en": "Having been told many times, he still forgot.",
        "cn": "= Although he had been told many times, he still forgot."
      },
      {
        "type": "h3",
        "text": "4.4 从句 ⇄ 非谓语动词的转换"
      },
      {
        "type": "larry",
        "text": "这一集是整个第四章的精髓。你会发现：定语从句可以压缩成分词，名词性从句可以压缩成动名词或不定式，状语从句可以压缩成分词短语。从句和非谓语—是同一个东西的两种写法，一个是\"完整版\"，一个是\"精简版\"。"
      },
      {
        "type": "h4",
        "text": "4.4.1 转换对照表"
      },
      {
        "type": "point",
        "text": "从句类型转换为转换前（从句）转换后（非谓语）\n定语从句（主动）现在分词the boy who is playingthe boy playing\n定语从句（被动）过去分词the car which was repairedthe car repaired\n名词性从句动名词That he arrived late…His arriving late…\n名词性从句不定式I hope that I will see you.I hope to see you.\n状语从句（时间）分词短语When he saw me…Seeing me…\n状语从句（原因）分词短语Because he was tired…Being tired…\n状语从句（条件）分词短语If it is used properly…Used properly…"
      },
      {
        "type": "h4",
        "text": "4.4.2 转换的黄金法则"
      },
      {
        "type": "tip",
        "text": "从句变非谓语三步法：\n\n1. 去连词（把 when/because/that/who 等拿掉）\n\n2. 去主语（从句主语和主句主语一致，省略从句主语；不一致则保留逻辑主语）\n\n3. 动词变非谓语（主动→doing，被动→done，将来/目的→to do）"
      },
      {
        "type": "exercise",
        "text": "练习 4.1：从句转非谓语\n\n将 The woman who is talking to Tom 转为非谓语形式\n将 Because he was exhausted, he fell asleep immediately. 转为分词作状语\n将 I hope that I can visit you soon. 转为不定式\n将 The house which was built in 1900 转为非谓语形式"
      },
      {
        "type": "summary",
        "text": "第四章总结\nLarry 的核心洞见：非谓语动词和从句是同一枚硬币的两面。从句是\"完整版\"（带连词、带主语、带时态），非谓语是\"精简版\"（去连词、去主语、去时态）。\n两者的选择取决于：你想表达得正式、清楚 → 用从句；你想表达得简洁、流畅 → 用非谓语。"
      }
    ]
  },
  {
    "id": "tense",
    "order": 5,
    "title": "时态——动词的时、体、貌",
    "subtitle": "Tense & Aspect",
    "intro": "时态是中国学生永远的痛。16 种时态，一个一个背，背了忘，忘了背。Larry 说：「时态」这个词本身就是误导。英语动词的形态变化不是在表达\"时间\"，而是在表达三个独立的维度：时（时间位置）、体（动作状态）、貌（主被动视角）。你不需要背 16…",
    "blocks": [
      {
        "type": "p",
        "text": "时态是中国学生永远的痛。16 种时态，一个一个背，背了忘，忘了背。Larry 说：「时态」这个词本身就是误导。英语动词的形态变化不是在表达\"时间\"，而是在表达三个独立的维度：时（时间位置）、体（动作状态）、貌（主被动视角）。你不需要背 16 种时态—你只需要理解这三个维度怎么组合。"
      },
      {
        "type": "h3",
        "text": "5.1 重新认识\"时态\""
      },
      {
        "type": "h4",
        "text": "5.1.1 三个维度"
      },
      {
        "type": "point",
        "text": "维度英文含义选项\n时Tense动作发生的时间位置现在 过去 将来 过去将来\n体Aspect动作的状态性质一般 进行 完成 完成进行\n貌Voice动作的视角方向主动 被动"
      },
      {
        "type": "larry",
        "text": "\"时\"回答的是\"什么时候\"；\"体\"回答的是\"动作怎么样了\"；\"貌\"回答的是\"谁做的\"。这三个维度是独立的，你可以像搭积木一样自由组合它们。"
      },
      {
        "type": "h4",
        "text": "5.1.2 一般体 vs 进行体 vs 完成体"
      },
      {
        "type": "point",
        "text": "一般体：陈述事实，不强调动作的状态。\n\nI read books.（我读书。—陈述一个习惯性事实）\n\nI read a book yesterday.（我昨天读了一本书。—陈述一个过去事实）\n\n进行体：强调动作\"正在进行中\"。\n\nI am reading a book.（我正在读一本书。—动作此刻在进行）\n\nI was reading when you called.（你打电话时我正在读。—过去某个时间点正在进行）\n\n完成体：强调动作\"已经发生\"且\"与某个时间点有关联\"。\n\nI have read that book.（我读过那本书。—过去读过，但现在知道内容）\n\nI had read the book before I saw the movie.（看电影之前就读过。—过去的过去）\n\n完成进行体：强调动作从过去持续到现在（或某个时间点），并且还在进行。\n\nI have been reading for two hours.（我已经读了两个小时了，还在读）"
      },
      {
        "type": "h3",
        "text": "5.2 时与体的组合（16种时态全表）"
      },
      {
        "type": "point",
        "text": "以 do 为例，主动语态完整时态表：\n\n一般体进行体完成体完成进行体\n现在do/doesam/is/are doinghave/has donehave/has been doing\n过去didwas/were doinghad donehad been doing\n将来will dowill be doingwill have donewill have been doing\n过去将来would dowould be doingwould have donewould have been doing\n\n你不必全部背诵。理解\"时\"（横向）和\"体\"（纵向）的组合逻辑，你就能自己推导出任何一格。\n被动语态的公式也极其简单：be + 过去分词，把 be 动词放到对应的时体中即可。\n\ndo/does → am/is/are done（一般现在被动）\n\nam/is/are doing → am/is/are being done（现在进行被动）\n\nhave/has done → have/has been done（现在完成被动）"
      },
      {
        "type": "h4",
        "text": "5.2.1 最常用的 6 种时态详解"
      },
      {
        "type": "point",
        "text": "1. 一般现在时 (do/does)\n\n用法：习惯性动作、客观真理、一般事实\n\nThe sun rises in the east.客观真理\nShe goes to work at 8 every day.习惯性动作\nWater boils at 100°C.科学事实\n\n2. 一般过去时 (did)\n\n用法：过去某个时间发生的、已经结束的动作\n\nI visited Paris last summer.有明确过去时间标志\nShe left an hour ago.ago = 过去时间标志\n\n3. 一般将来时 (will do / be going to do)\n\n用法：将来发生的事\n\nI will call you tomorrow.will = 临时决定/预测\nI am going to study abroad.be going to = 计划好的/有迹象的\n\n4. 现在进行时 (am/is/are doing)\n\n用法：此刻正在发生的动作、近期计划\n\nShe is reading a book right now.此刻进行\nI am meeting him tomorrow.近期计划（注意：用进行时表将来）\n\n5. 现在完成时 (have/has done)\n\n用法：过去的动作对现在有影响；从过去持续到现在的状态\n\nI have lost my key.（所以我现在进不去）过去动作 → 现在有影响\nShe has lived here for 10 years.（现在还住在这里）从过去持续到现在\n\n6. 过去完成时 (had done)\n\n用法：\"过去的过去\"—在过去某个时间点之前已经完成的动作\n\nWhen I arrived, the movie had already started.电影开始（先发生）→ 我到达（后发生）→ 用 had done\nShe had never seen snow before she moved to Canada."
      },
      {
        "type": "h3",
        "text": "5.3 时态难点辨析"
      },
      {
        "type": "h4",
        "text": "5.3.1 现在完成时 vs 一般过去时"
      },
      {
        "type": "warn",
        "text": "这是最高频的混淆。\n\n现在完成时：动作发生在过去，但和现在有关联。\n\n一般过去时：动作发生在过去，和现在没有关联。\n\nI have lost my key. → 现在进行时态，因为我进不去（现在有关联）\n\nI lost my key yesterday. → 昨天丢了，也许找到了也许没有，不强调和现在的关联\n\nHe has been to Japan. → 他去过日本（知道那里什么样）\n\nHe went to Japan last year. → 他去年去了日本（叙述过去的事）"
      },
      {
        "type": "h4",
        "text": "5.3.2 will vs be going to"
      },
      {
        "type": "point",
        "text": "will：说话时临时决定的、预测的、承诺的\n\nThe phone is ringing. I will answer it.（临时决定）\n\nbe going to：事先计划好的、根据现有迹象推测的\n\nLook at those clouds! It is going to rain.（有迹象）\n\nI am going to visit my parents this weekend.（有计划）"
      },
      {
        "type": "h4",
        "text": "5.3.3 不能用\"进行体\"的动词（静态动词）"
      },
      {
        "type": "warn",
        "text": "有些动词表达的是\"状态\"而非\"动作\"，不能用进行体：\n\n感官：see, hear, smell（注意：表示动作时可以用—I am seeing a doctor = 我在看医生）\n\n心理：know, believe, understand, remember, forget\n\n情感：like, love, hate, want, need\n\n所属：have, own, belong, possess\n\n✗ I am knowing the answer.\n\n✓ I know the answer."
      },
      {
        "type": "exercise",
        "text": "练习 5.1：时态\n\nI _____ (live) here since 2010.\nWhen I got to the station, the train _____ (already leave).\nLook! It _____ (rain) outside.\nShe _____ (go) to Beijing three times.\nBy next year, I _____ (study) English for 10 years."
      }
    ]
  },
  {
    "id": "subjunctive",
    "order": 6,
    "title": "虚拟语气",
    "subtitle": "Subjunctive Mood",
    "intro": "虚拟语气是中国学生最怕的语法点。Larry 说：你只需要从一个角度理解虚拟语气—它在表达的是\"假的、不可能的、与事实相反的\"东西。一旦你接受了这个角度，虚拟语气的所有规则都变成了逻辑推导，而不是死记硬背。…",
    "blocks": [
      {
        "type": "p",
        "text": "虚拟语气是中国学生最怕的语法点。Larry 说：你只需要从一个角度理解虚拟语气—它在表达的是\"假的、不可能的、与事实相反的\"东西。一旦你接受了这个角度，虚拟语气的所有规则都变成了逻辑推导，而不是死记硬背。"
      },
      {
        "type": "h3",
        "text": "6.1 虚拟语气的本质"
      },
      {
        "type": "larry",
        "text": "陈述语气说真话，祈使语气下命令，虚拟语气说假话。就这么简单。"
      },
      {
        "type": "point",
        "text": "三种语气的对比：\n\nHe is here. → 陈述语气（陈述事实：他在这里）\n\nBe here at 8! → 祈使语气（下命令：8点到这儿！）\n\nI wish he were here. → 虚拟语气（与事实相反：我希望他在这里，但他不在）"
      },
      {
        "type": "h4",
        "text": "6.1.1 虚拟语气的核心：时态倒退"
      },
      {
        "type": "tip",
        "text": "虚拟语气有一个非常巧妙的规律：把时态向过去倒退一格。\n\n与现在事实相反 → 用过去时（do → did, is → were）\n\n与过去事实相反 → 用过去完成时（did → had done）\n\n与将来事实相反 → 用过去时或特殊形式"
      },
      {
        "type": "h3",
        "text": "6.2 虚拟语气的三大场景（if 条件句）"
      },
      {
        "type": "point",
        "text": "场景If 从句主句例句\n与现在相反did / werewould doIf I had money, I would buy a car.（但我没钱）\n与过去相反had donewould have doneIf I had known, I would have come.（但我当时不知道）\n与将来相反did / were to do / should dowould doIf it rained tomorrow, I would stay home.（但明天不太可能下雨）"
      },
      {
        "type": "h4",
        "text": "6.2.1 详细例句"
      },
      {
        "type": "point",
        "text": "与现在事实相反：\nIf I were you, I would accept the offer.事实：我不是你\nIf she had more time, she would exercise regularly.事实：她没有更多时间\nIf he knew the answer, he would tell us.事实：他不知道答案\n\n与过去事实相反：\nIf you had studied harder, you would have passed the exam.事实：你当时没有更努力，你没通过\nIf he had left earlier, he wouldn't have missed the train.事实：他走得晚，错过了火车\nIf I had seen you, I would have said hello.事实：我当时没看到你\n\n与将来事实相反（或极不可能发生）：\nIf the sun rose in the west, I would believe you.事实：太阳不可能从西边升起\nIf I were to win the lottery, I would travel the world.极不可能（were to do = 万一）"
      },
      {
        "type": "h4",
        "text": "6.2.2 混合虚拟语气"
      },
      {
        "type": "p",
        "text": "当 if 从句和主句的时间不一致时："
      },
      {
        "type": "example",
        "en": "If I had studied harder in college （过去）, I would have a better job now （现在）.",
        "cn": ""
      },
      {
        "type": "example",
        "en": "If he were more careful （现在的一般状态）, he wouldn't have made that mistake yesterday （过去的错误）.",
        "cn": ""
      },
      {
        "type": "h4",
        "text": "6.2.3 虚拟语气的倒装（省略 if）"
      },
      {
        "type": "point",
        "text": "在正式书面语中，可以把 if 省略，将 were / had / should 提到句首：\nWere I you, I would go. = If I were you…\nHad I known, I would have come. = If I had known…\nShould it rain, we'll stay home. = If it should rain…"
      },
      {
        "type": "h3",
        "text": "6.3 其他虚拟语气形式"
      },
      {
        "type": "point",
        "text": "1. wish + 虚拟（愿望与事实相反）\nI wish I were taller.（与现在相反）\nI wish I had studied harder.（与过去相反）\nI wish you would come.（与将来相反/抱怨）\n\n2. as if / as though + 虚拟（好像…其实不是）\nHe talks as if he knew everything.（其实他不知道）\nShe looks as though she had seen a ghost.（其实她没看到）\n\n3. would rather + 虚拟（宁愿…）\nI would rather you stayed here.（与现在/将来相反—我希望你留下）\nI would rather you hadn't told him.（与过去相反—我希望你没告诉他）\n\n4. suggest / recommend / insist / demand + (should) do\nI suggest that he (should) go.（should 可以省略，动词用原形）\nThe doctor recommended that she take a rest.\nIt is essential that everyone be on time.\n\n5. It's (high) time + did\nIt's time you went to bed.（该睡觉了—虚拟语气表示\"该做而还没做\"）\nIt's high time we took action."
      },
      {
        "type": "exercise",
        "text": "练习 6.1：虚拟语气\n\nIf I _____ (be) you, I _____ (not do) that.\nI wish I _____ (know) the answer yesterday.\n_____ (Had / If had) he been more careful, the accident wouldn't have happened.\nThe teacher suggested that every student _____ (read) the book."
      }
    ]
  },
  {
    "id": "lexical-grammar",
    "order": 7,
    "title": "词法进阶",
    "subtitle": "Advanced Lexical Grammar",
    "intro": "前面的六章都在讲\"句法\"—句子是怎么构成的。这一章补上\"词法\"的部分—单词本身的形态变化。很多细节是考试中的高频考点。…",
    "blocks": [
      {
        "type": "p",
        "text": "前面的六章都在讲\"句法\"—句子是怎么构成的。这一章补上\"词法\"的部分—单词本身的形态变化。很多细节是考试中的高频考点。"
      },
      {
        "type": "h3",
        "text": "7.1 名词与冠词"
      },
      {
        "type": "h4",
        "text": "7.1.1 可数名词单数不可裸露原则"
      },
      {
        "type": "larry",
        "text": "英语有一条铁律：可数名词的单数形式不能光着身子出现。它前面必须有衣服—a / an / the / this / that / my / your 等限定词。"
      },
      {
        "type": "point",
        "text": "✗ I have book. → ✓ I have a book.\n\n✗ Dog is cute. → ✓ The dog is cute. / Dogs are cute.\n\n✗ Teacher told me. → ✓ The/My/A teacher told me."
      },
      {
        "type": "tip",
        "text": "总结：可数名词单数必须以 a/an/the/this/that/my/your/his/her/its/our/their/Tom's 等限定词开头。否则你就得把它变成复数。"
      },
      {
        "type": "h4",
        "text": "7.1.2 冠词 a/an/the 的用法"
      },
      {
        "type": "point",
        "text": "冠词含义使用场景\na / an泛指、不确定、第一次提到I saw a movie yesterday.\nthe特指、双方都知道、上文提过、独一无二The movie was great.\n零冠词泛指复数、不可数名词泛指、专有名词Water is essential. / Books are my friends."
      },
      {
        "type": "point",
        "text": "用 the 的典型场景：\n\n1. 上文提过的：I bought a book. The book is interesting.\n\n2. 独一无二的：the sun, the moon, the earth\n\n3. 序数词/最高级前：the first, the best\n\n4. 双方都知道的：Please close the door.\n\n5. 乐器前：play the piano（但球类不加：play basketball）\n\n6. 江河湖海山脉：the Yangtze River, the Alps"
      },
      {
        "type": "h4",
        "text": "7.1.3 名词复数规则"
      },
      {
        "type": "point",
        "text": "规则变化：\n\n一般 +s：book → books\n\n以 s/x/sh/ch 结尾 +es：bus → buses, box → boxes\n\n辅音 + y → ies：baby → babies, city → cities\n\n以 f/fe 结尾 → ves：knife → knives, leaf → leaves\n\n以 o 结尾：+es（potato → potatoes）或 +s（photo → photos，规律较灵活）\n\n常见不规则：\n\nman → men, woman → women, child → children, foot → feet, tooth → teeth\n\nmouse → mice, goose → geese, ox → oxen\n\nsheep → sheep（不变）, deer → deer, fish → fish/fishes"
      },
      {
        "type": "h3",
        "text": "7.2 形容词与副词的比较级"
      },
      {
        "type": "h4",
        "text": "7.2.1 基本规则"
      },
      {
        "type": "point",
        "text": "形式结构示例\n比较级adj/adv + -er / more + adj/advtaller, more beautiful\n最高级the + adj/adv + -est / the most + adj/advthe tallest, the most beautiful\n同级比较as + adj/adv + asas tall as"
      },
      {
        "type": "h4",
        "text": "7.2.2 重点比较句型"
      },
      {
        "type": "point",
        "text": "She is taller than I (am). → 她比我高\n\nThe more you practice, the better you get. → 练习越多，进步越大\n\nHe is the taller of the two. → 两人中较高的那个\n\nThis is less interesting than that. → 这个不如那个有趣\n\nChina is much bigger than Japan. → 修饰比较级的词：much, far, a lot, even, still, a bit"
      },
      {
        "type": "warn",
        "text": "常见错误：\n\n✗ He is more taller than me.（more 和 -er 不能同时用）\n\n✓ He is much taller than me. / He is taller than me."
      },
      {
        "type": "h3",
        "text": "附录A：英语语法体系全景图"
      },
      {
        "type": "h3",
        "text": "附录B：综合练习（答案见末尾）"
      },
      {
        "type": "exercise",
        "text": "综合练习\n\nThe book _____ I read last week is really interesting. (which / what / who)\n_____ you study hard, you won't pass the exam. (If / Unless / Although)\nI'm looking forward to _____ you. (see / seeing / seen)\nBy the time we arrived, the movie _____. (already started / had already started / has already started)\nIf I _____ you, I wouldn't trust him. (am / was / were)\n_____ from the top, the city looks amazing. (Seeing / Seen / To see)\nHe is _____ tall _____ he can reach the ceiling. (so…that / such…that / too…to)\nI don't know _____ he wants. (what / that / whether)\nThe man _____ car was stolen called the police. (who / whom / whose)\nStop _____ and listen to me. (to talk / talking / talked)"
      },
      {
        "type": "h3",
        "text": "附录C：不规则动词表（精选高频动词）"
      },
      {
        "type": "point",
        "text": "原形过去式过去分词含义\nbewas/werebeen是\nbecomebecamebecome变成\nbeginbeganbegun开始\nbreakbrokebroken打破\nbringbroughtbrought带来\nbuildbuiltbuilt建造\nbuyboughtbought买\ncatchcaughtcaught抓住\nchoosechosechosen选择\ncomecamecome来\ndodiddone做\ndrinkdrankdrunk喝\ndrivedrovedriven驾驶\neatateeaten吃\nfallfellfallen落下\nfeelfeltfelt感觉\nfindfoundfound找到\nflyflewflown飞\nforgetforgotforgotten忘记\ngetgotgot/gotten得到\ngivegavegiven给\ngowentgone去\nhavehadhad有\nhearheardheard听见\nkeepkeptkept保持\nknowknewknown知道\nleaveleftleft离开\nloselostlost丢失\nmakemademade做/使\nmeetmetmet遇见\npaypaidpaid支付\nputputput放\nreadreadread读\nrunranrun跑\nsaysaidsaid说\nseesawseen看见\nsellsoldsold卖\nsendsentsent发送\nsingsangsung唱\nsitsatsat坐\nsleepsleptslept睡觉\nspeakspokespoken说话\nspendspentspent花费\nstandstoodstood站立\nswimswamswum游泳\ntaketooktaken拿/带\nteachtaughttaught教\ntelltoldtold告诉\nthinkthoughtthought想\nthrowthrewthrown扔\nunderstandunderstoodunderstood理解\nwearworeworn穿\nwinwonwon赢\nwritewrotewritten写"
      },
      {
        "type": "exercise",
        "text": "综合练习答案\n1. which 2. Unless 3. seeing 4. had already started 5. were\n\n6. Seen 7. so; that 8. what 9. whose 10. talking"
      },
      {
        "type": "p",
        "text": "「世界上所有句子都只有两种成分："
      },
      {
        "type": "p",
        "text": "被修饰的，和修饰别人的。"
      },
      {
        "type": "p",
        "text": "你只需要学会分辨这两样，你就学会了语法。」"
      },
      {
        "type": "p",
        "text": "— Larry"
      },
      {
        "type": "p",
        "text": "本文档基于 Larry（B站：Larry想做技术大佬）语法系列课程 28 集视频整理\n\n涵盖：词性 · 简单句 · 从句 · 非谓语动词 · 时态 · 虚拟语气 · 词法解析\n\n文档版本 2.0 · 2026年7月28日"
      }
    ]
  }
];
