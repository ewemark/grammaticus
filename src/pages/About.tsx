export default function About() {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-micro)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-micro)',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          margin: '0 0 var(--space-md)',
        }}
      >
        ABOUT
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-display-xl)',
          fontWeight: 700,
          lineHeight: 'var(--leading-heading)',
          letterSpacing: 'var(--tracking-heading)',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
          margin: '0 0 var(--space-xxl)',
        }}
      >
        关于 Grammaticus
      </h2>

      <div style={{ maxWidth: 640 }}>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Grammaticus 这个名字来自拉丁语，意思是"语法老师"或"语言学者"。但我想做的，并不是一个板着脸教你背规则的工具，而是希望能成为你学习路上一个温和的陪伴者。
        </p>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-heading)', color: 'var(--color-text)', margin: 'var(--space-xxl) 0 var(--space-md)' }}>
          我的理念：语言，要在使用中学习
        </h3>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          这些年，我们习惯了用各种 App 打卡、刷词、做选择题。似乎学英语就是"记住越多单词，考试分数越高"。可真正走出考场，面对一篇英文文章、一封工作邮件、一次海外旅行时，很多人还是会觉得——那些背过的东西，好像用不上。
        </p>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          问题出在哪里？我想，是因为我们把语言当成了"知识"来记忆，而不是"技能"来练习。
        </p>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          真正的语言能力，不是脑子里堆了多少词汇，而是你能否在真实的场景里听懂、读懂、说出、写出。语言只有在被使用的时候，才真正活过来。
        </p>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          所以 Grammaticus 的出发点很简单：帮你把英语放到真实的上下文里去感受。无论是一篇你喜欢的新闻、一段电影台词，还是你工作里遇到的专业材料——把它交给 Grammaticus，我们会试着帮你拆解其中的词汇和表达，让你在"用"的过程中自然吸收。
        </p>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-heading)', color: 'var(--color-text)', margin: 'var(--space-xxl) 0 var(--space-md)' }}>
          我想对你说
        </h3>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          做这个项目，源于我自己学英语时的挫败感。背了又忘、忘了又背，那种循环让我一度失去兴趣。后来我发现，当我为了读懂某篇感兴趣的文章而去查词时，那些词反而记得更牢。那一刻我意识到：有意义的学习，比有毅力的学习更重要。
        </p>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          所以，我不希望你用 Grammaticus 来"完成每天的任务"。我更希望你能带着好奇心来——好奇某句话为什么这样写，某个词在这里为什么是这个意思。哪怕一天只弄懂一个句子，也比机械地刷 50 个单词有价值。
        </p>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          项目目前还在成长中，可能有很多不完善的地方，但我会一直保持更新。如果你在使用中有什么想法、困惑，或者单纯的吐槽，都非常欢迎告诉我——因为我知道，真正好的工具，是和使用者一起长出来的。
        </p>

        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          在这里，我也想特别感谢 Larry 老师。感谢他对 Grammaticus 视频内容的慷慨赞助，更感谢他长期以来在网上无私分享优质课程的精神。在这个知识越来越被"付费墙"包围的时代，Larry 老师依然坚持把高质量的学习资源开放给所有人，这种胸怀和信念，深深影响了我，也让我更有动力把 Grammaticus 做好、做长久。
        </p>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-body-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', color: 'var(--color-text)', marginTop: 'var(--space-xxl)' }}>
          愿 Grammaticus 能陪你走一段踏实的英语学习路。
        </p>
      </div>
    </div>
  )
}
