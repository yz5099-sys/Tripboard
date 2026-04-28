from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from textwrap import wrap
from xml.sax.saxutils import escape
import zipfile


OUT = Path("/Users/zhuyifei/Documents/New project/presentation/friendship_presentation.pptx")


SLIDES = [
    {
        "title": "网络化公共中的友谊",
        "subtitle": "danah boyd《Friendship》\n出自 Hanging Out, Messing Around, and Geeking Out 第二章\n核心问题：当友谊变得可见、可存档、可搜索、可被平台组织时，传播发生了什么变化？",
    },
    {
        "title": "为什么选这一章？",
        "bullets": [
            "我选择这一章，是因为我对传播技术如何塑造身份、归属感与社交压力非常感兴趣。",
            "“友谊”其实是一个高度理论化的传播现场：自我呈现、受众管理、地位协商、平台可供性都在里面发生。",
            "我想论证的重点是：社交媒体不是现实之外的第二世界，而是在重组我们日常社会关系的组织方式。",
        ],
    },
    {
        "title": "作者、作品与研究背景",
        "bullets": [
            "本书由 Mizuko Ito 牵头，第二章《Friendship》的 lead author 是 danah boyd。",
            "研究基础是 Digital Youth Project，由 MacArthur Foundation 的 Digital Media and Learning 计划资助。",
            "方法上属于多地点、协作式民族志，材料主要来自 2005 到 2008 年的访谈与线上线下观察。",
            "对传播理论的价值在于：它关注的是“互动如何被实践出来”，而不仅仅是媒体效果。",
        ],
    },
    {
        "title": "社会、文化与历史语境",
        "bullets": [
            "美国青少年同伴文化长期受学校中心化、年龄分隔、成人监督以及商业青年文化影响。",
            "1980 年代，商场是青少年“hang out”的象征性空间；到 2000 年代中后期，MySpace、Facebook、IM 与手机变成关键基础设施。",
            "最重要的变化是：朋友离开学校以后，互动并没有结束，而是被延长到持续在线的状态里。",
        ],
        "footer": "讨论：社交媒体是在替代线下友谊空间，还是在把线下友谊延伸到新的时空条件中？",
    },
    {
        "title": "本章的核心论点",
        "bullets": [
            "社交媒体并没有“发明”青少年友谊。",
            "它真正做的是强化、延展并重新编排原有的同伴关系动态。",
            "boyd 关心的是：技术如何帮助建立关系、巩固关系、复杂化关系，甚至伤害关系。",
            "因此我们要问的不是“社交媒体好不好”，而是“平台让哪些社会性交往更容易、更困难、更可见、更有后果”。",
        ],
    },
    {
        "title": "核心概念：networked publics",
        "bullets": [
            "boyd 认为社交媒体塑造出一种“网络化公共”。",
            "它有四个关键属性：persistence、searchability、replicability、scalability。",
            "这意味着平台并不是中性的传播管道，而是在组织什么能被看见、被记住、被扩散、被评价。",
            "可供性并不机械决定行为，但它会重新安排互动的可能性与压力结构。",
        ],
    },
    {
        "title": "贡献一：友谊是一种传播基础设施",
        "bullets": [
            "多数青少年在线互动的对象，仍然是他们在线下学校与本地生活中已经认识的人。",
            "所以“线上/线下二分”其实有误导性。",
            "friendship-driven participation 包括聊天、签到、彼此关注、持续更新近况、维持在场感。",
            "换句话说，媒介化传播在身体分离之后，继续维持着同伴公共的运作。",
        ],
    },
    {
        "title": "贡献二：四种友谊协商",
        "bullets": [
            "making friends：如何建立关系",
            "performing friendships：如何表演/展示友谊",
            "articulating friendship hierarchies：如何把友谊层级说出来、排出来",
            "navigating status, attention, and drama：如何处理地位、注意力与戏剧化冲突",
            "这个分析框架的好处是，它让我们从“媒体是好是坏”转向“这里究竟在做什么传播工作”。",
        ],
        "footer": "讨论：在今天的平台上，这四种协商里你觉得哪一种最核心？",
    },
    {
        "title": "例子一：建立关系",
        "bullets": [
            "青少年通常不是随机结识陌生人，而是通过既有同伴网络扩大关系。",
            "数字媒介帮助弱连接转化成更稳固的关系。",
            "但 friend request 和公开好友列表，也会把“谁被纳入、谁被排除”变得高度可见。",
            "所以一个看似简单的“加好友”动作，本身就是关于归属与认同的公共言语行为。",
        ],
    },
    {
        "title": "例子二：表演友谊",
        "bullets": [
            "友谊不只是被感受，也被展示出来。",
            "留言、照片、主页互动、公开评论都会成为“亲密关系”的表演形式。",
            "这与 Goffman 的拟剧论高度相关：友谊在受众面前被不断上演。",
            "但平台让前台与后台的边界变得更模糊，因为表演会被保存、复制、转发。",
        ],
        "footer": "讨论：当友谊变成可见内容时，表演是在强化亲密，还是在掏空亲密？",
    },
    {
        "title": "例子三：给朋友排名",
        "bullets": [
            "MySpace 的 Top Friends 功能把原本模糊的社会层级强行显性化。",
            "过去可以策略性含糊处理的关系，被界面转化成了可计数、可比较的排序。",
            "这说明界面设计本身会把地位逻辑制度化，并强化比较。",
            "今天的等价物可能是 close friends 列表、streak、点赞数、转发量、算法可见性。",
        ],
    },
    {
        "title": "例子四：地位、注意力与 drama",
        "bullets": [
            "社交媒体会放大八卦、流言、嫉妒与冲突。",
            "但本章的重要判断是：这些 drama 往往不是全新的，而是被重新格式化了。",
            "网络化可见性带来了更大的受众、更长的留存、更快的扩散，以及更难解释的语境。",
            "原本普通的同伴冲突，一旦变得公开、可存档、可截图，后果就会被放大。",
        ],
    },
    {
        "title": "理论对话与延伸",
        "bullets": [
            "Goffman：自我呈现进入网络化场景，并出现 audience collapse。",
            "Bourdieu：友谊可被理解为 social capital，而平台让这种资本更可见、更可计量。",
            "Affordance theory：技术特征会塑造互动，但不会简单决定互动。",
            "Habermas 作为对照：这里不是理性批判公共领域，而是情感化、地位化、同伴化的公共。",
        ],
    },
    {
        "title": "我的批判与更新",
        "bullets": [
            "优点：民族志材料丰富，不落入技术决定论，也认真对待青少年作为社会行动者。",
            "局限：美国中心、学校中心，而且高度属于 MySpace/Facebook 时代。",
            "它对 platform capitalism 与算法分发机制讨论得还不够。",
            "放到 2026 年看，友谊表演已经与推荐系统、截图传播、跨平台流通、网红文化更深地缠绕在一起。",
        ],
        "footer": "讨论：今天的算法推荐，是否已经和同伴选择一样深地塑造友谊？",
    },
    {
        "title": "课堂活动：重设计一个“友谊平台”",
        "bullets": [
            "2 分钟个人思考，3 分钟两人讨论，3 分钟全班分享。",
            "请你们设计一个“为了友谊而不是为了注意力榨取”而存在的平台。",
            "你们可以删掉、重做或新增一个功能：点赞、好友数量、已读回执、排名系统、截图、算法推荐流。",
            "理论要求：你的设计解决了什么传播问题？它又会制造什么新的问题？",
        ],
    },
    {
        "title": "如果想更有趣：meme 版本活动",
        "bullets": [
            "任务：做一个 meme，准确表达本章的一个核心观点。",
            "可选主题：Top Friends 毁掉了社交外交；audience collapse starter pack；友谊变成仪表盘指标。",
            "汇报问题一：这个 meme 里面嵌入了什么理论？",
            "汇报问题二：它对平台文化提出了什么批判？",
        ],
    },
    {
        "title": "结论",
        "bullets": [
            "友谊从来不在媒介系统之外。",
            "平台并没有取代社会生活，而是在重组社会生活的可见性、时间性与后果结构。",
            "本章持续有价值，是因为它给了我们理解“媒介化友谊”作为社会实践的一套词汇。",
            "最后的问题是：如果友谊总是通过传播被表演出来，那么平台究竟让哪种友谊变得更可想象？",
        ],
    },
    {
        "title": "可补充的媒体材料与来源",
        "bullets": [
            "MIT Press 书籍页面：mitpress.mit.edu/9780262258265/hanging-out-messing-around-and-geeking-out/",
            "本次核对使用的开放 PDF：s3.amazonaws.com/files.commons.gc.cuny.edu/.../Ito-Hanging_Out.pdf",
            "danah boyd 简介：datasociety.net/people/boyd-danah/",
            "Mizuko Ito 简介：mitpress.mit.edu/author/mizuko-ito-6754",
            "视频建议：PBS Frontline《Growing Up Online》(2008)：pbs.org/video/frontline-growing-up-online/",
        ],
    },
]


NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_P = "http://schemas.openxmlformats.org/presentationml/2006/main"


def emu(inches: float) -> int:
    return int(inches * 914400)


def paragraph_xml(text: str, level: int = 0, size: int = 2200, bold: bool = False) -> str:
    attrs = []
    if level:
        attrs.append(f'lvl="{level}"')
    ppr = f"<a:pPr {' '.join(attrs)}/>" if attrs else "<a:pPr/>"
    rpr = [f'lang="en-US"', f'sz="{size}"']
    if bold:
        rpr.append('b="1"')
    return (
        f"<a:p>{ppr}<a:r><a:rPr {' '.join(rpr)}/><a:t>{escape(text)}</a:t></a:r></a:p>"
    )


def split_bullets(text: str, width: int = 52) -> list[str]:
    wrapped = wrap(text, width=width, break_long_words=False, break_on_hyphens=False)
    return wrapped or [text]


def text_box(x: float, y: float, w: float, h: float, paragraphs: list[str], font_size: int = 2200,
             fill: str | None = None, line: str | None = None, color: str = "1F2937",
             rounded: bool = False, margin_l: int = 120000, margin_r: int = 120000,
             margin_t: int = 70000, margin_b: int = 70000) -> str:
    sp_pr = [
        '<a:xfrm><a:off x="{0}" y="{1}"/><a:ext cx="{2}" cy="{3}"/></a:xfrm>'.format(
            emu(x), emu(y), emu(w), emu(h)
        )
    ]
    shape = "roundRect" if rounded else "rect"
    sp_pr.append(f'<a:prstGeom prst="{shape}"><a:avLst/></a:prstGeom>')
    if fill:
        sp_pr.append(f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>')
    else:
        sp_pr.append("<a:noFill/>")
    if line:
        sp_pr.append(f'<a:ln w="12700"><a:solidFill><a:srgbClr val="{line}"/></a:solidFill></a:ln>')
    else:
        sp_pr.append("<a:ln><a:noFill/></a:ln>")
    tx_paragraphs = "".join(paragraph_xml(p, size=font_size) for p in paragraphs)
    return f"""
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="1" name="TextBox"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>{''.join(sp_pr)}</p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" lIns="{margin_l}" rIns="{margin_r}" tIns="{margin_t}" bIns="{margin_b}" anchor="t"/>
        <a:lstStyle/>
        {tx_paragraphs}
        <a:endParaRPr lang="en-US" sz="{font_size}" dirty="0"/>
      </p:txBody>
    </p:sp>
    """


def title_box(title: str) -> str:
    return text_box(
        0.6, 0.4, 12.0, 0.8, [title], font_size=2800, fill=None, line=None, color="0F172A"
    ).replace("<a:rPr lang=\"en-US\" sz=\"2800\"/>", "<a:rPr lang=\"en-US\" sz=\"2800\" b=\"1\"/>")


def bullets_box(bullets: list[str]) -> str:
    paras: list[str] = []
    for bullet in bullets:
        lines = split_bullets(f"• {bullet}")
        paras.extend(lines)
        paras.append("")
    if paras and paras[-1] == "":
        paras.pop()
    return text_box(0.8, 1.55, 11.6, 4.9, paras, font_size=2000, fill="F8FAFC", line="CBD5E1", rounded=True)


def subtitle_box(text: str) -> str:
    paras = []
    for raw in text.splitlines():
        paras.extend(split_bullets(raw, width=60))
        paras.append("")
    if paras:
        paras.pop()
    return text_box(0.9, 2.0, 11.0, 2.7, paras, font_size=2200, fill="EFF6FF", line="93C5FD", rounded=True)


def footer_box(text: str) -> str:
    paras = split_bullets(text, width=80)
    return text_box(0.8, 6.9, 11.6, 0.55, paras, font_size=1500, fill="FEF3C7", line="F59E0B", rounded=True)


def accent_bar() -> str:
    return text_box(0.0, 0.0, 13.333, 0.22, [], fill="0F766E", line=None, margin_l=0, margin_r=0, margin_t=0, margin_b=0)


def slide_xml(title: str, subtitle: str | None = None, bullets: list[str] | None = None, footer: str | None = None) -> str:
    shapes = [accent_bar(), title_box(title)]
    if subtitle:
        shapes.append(subtitle_box(subtitle))
    if bullets:
        shapes.append(bullets_box(bullets))
    if footer:
        shapes.append(footer_box(footer))
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="FFFDF8"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="0" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      {''.join(shapes)}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>
"""


def content_types_xml(slide_count: int) -> str:
    overrides = "\n".join(
        f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(1, slide_count + 1)
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  {overrides}
</Types>
"""


def root_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""


def app_xml(slide_count: int) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
  <PresentationFormat>On-screen Show (4:3)</PresentationFormat>
  <Slides>{slide_count}</Slides>
  <Notes>0</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Slides</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>{slide_count}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="{slide_count}" baseType="lpstr">
      {''.join('<vt:lpstr>Slide</vt:lpstr>' for _ in range(slide_count))}
    </vt:vector>
  </TitlesOfParts>
  <Company>OpenAI</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>
"""


def core_xml() -> str:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Friendship Presentation</dc:title>
  <dc:subject>Communication Theory</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:keywords>friendship; danah boyd; communication theory</cp:keywords>
  <dc:description>Slides for a 45-minute presentation on chapter 2, Friendship.</dc:description>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>
"""


def presentation_xml(slide_count: int) -> str:
    sld_ids = "\n".join(
        f'<p:sldId id="{256 + i}" r:id="rId{i + 1}"/>' for i in range(slide_count)
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId{slide_count + 1}"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    {sld_ids}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>
"""


def presentation_rels_xml(slide_count: int) -> str:
    rels = [
        f'<Relationship Id="rId{i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i + 1}.xml"/>'
        for i in range(slide_count)
    ]
    rels.append(
        f'<Relationship Id="rId{slide_count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    )
    rels.append(
        f'<Relationship Id="rId{slide_count + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>'
    )
    rels.append(
        f'<Relationship Id="rId{slide_count + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>'
    )
    rels.append(
        f'<Relationship Id="rId{slide_count + 4}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>'
    )
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  %s
</Relationships>
""" % "\n  ".join(rels)


def slide_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>
"""


def slide_layout_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}" type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"""


def slide_layout_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"""


def slide_master_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}">
  <p:cSld name="Office Theme">
    <p:bg>
      <p:bgRef idx="1001">
        <a:schemeClr val="bg1"/>
      </p:bgRef>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle>
      <a:lvl1pPr algn="l"/>
    </p:titleStyle>
    <p:bodyStyle>
      <a:lvl1pPr marL="0" indent="0"/>
    </p:bodyStyle>
    <p:otherStyle>
      <a:defPPr/>
    </p:otherStyle>
  </p:txStyles>
</p:sldMaster>
"""


def slide_master_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"""


def theme_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Simple Theme">
  <a:themeElements>
    <a:clrScheme name="Simple">
      <a:dk1><a:srgbClr val="0F172A"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F2937"/></a:dk2>
      <a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>
      <a:accent1><a:srgbClr val="0F766E"/></a:accent1>
      <a:accent2><a:srgbClr val="2563EB"/></a:accent2>
      <a:accent3><a:srgbClr val="F59E0B"/></a:accent3>
      <a:accent4><a:srgbClr val="DC2626"/></a:accent4>
      <a:accent5><a:srgbClr val="7C3AED"/></a:accent5>
      <a:accent6><a:srgbClr val="475569"/></a:accent6>
      <a:hlink><a:srgbClr val="2563EB"/></a:hlink>
      <a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Simple">
      <a:majorFont>
        <a:latin typeface="Aptos Display"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Aptos"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Simple">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="50000"/></a:schemeClr></a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
  <a:extraClrSchemeLst/>
</a:theme>
"""


def pres_props_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentationPr xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}">
  <p:showPr loop="0" useTimings="0"/>
</p:presentationPr>
"""


def view_props_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:viewPr xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}" lastView="sldView">
  <p:normalViewPr>
    <p:restoredLeft sz="15620"/>
    <p:restoredTop sz="94660"/>
  </p:normalViewPr>
  <p:slideViewPr/>
  <p:notesTextViewPr/>
  <p:gridSpacing cx="780288" cy="780288"/>
</p:viewPr>
"""


def table_styles_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>
"""


def build() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml(len(SLIDES)))
        zf.writestr("_rels/.rels", root_rels_xml())
        zf.writestr("docProps/app.xml", app_xml(len(SLIDES)))
        zf.writestr("docProps/core.xml", core_xml())
        zf.writestr("ppt/presentation.xml", presentation_xml(len(SLIDES)))
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels_xml(len(SLIDES)))
        zf.writestr("ppt/presProps.xml", pres_props_xml())
        zf.writestr("ppt/viewProps.xml", view_props_xml())
        zf.writestr("ppt/tableStyles.xml", table_styles_xml())
        zf.writestr("ppt/theme/theme1.xml", theme_xml())
        zf.writestr("ppt/slideMasters/slideMaster1.xml", slide_master_xml())
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", slide_master_rels_xml())
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", slide_layout_xml())
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slide_layout_rels_xml())

        for idx, slide in enumerate(SLIDES, start=1):
            zf.writestr(
                f"ppt/slides/slide{idx}.xml",
                slide_xml(
                    title=slide["title"],
                    subtitle=slide.get("subtitle"),
                    bullets=slide.get("bullets"),
                    footer=slide.get("footer"),
                ),
            )
            zf.writestr(f"ppt/slides/_rels/slide{idx}.xml.rels", slide_rels_xml())


if __name__ == "__main__":
    build()
