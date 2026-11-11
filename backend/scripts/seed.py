"""种子数据：城市、示例用户、示例点位、评论与评分。

用法（在 backend 目录下）：
    .venv/Scripts/python -m scripts.seed
脚本可重复执行：已存在的数据会跳过，不会产生重复。
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.city import City
from app.models.comment import Comment
from app.models.rating import Rating
from app.models.spot import Spot
from app.models.spot_event import SpotEvent
from app.models.user import User

# ---------------------------------------------------------------------------
# 城市：覆盖主要钓友聚集城市，附带经纬度用于定位与距离排序
# ---------------------------------------------------------------------------
CITIES: list[tuple[str, str, str, float, float, bool]] = [
    ("杭州", "浙江", "hangzhou", 30.2741, 120.1551, True),
    ("宁波", "浙江", "ningbo", 29.8683, 121.5440, True),
    ("温州", "浙江", "wenzhou", 27.9938, 120.6994, False),
    ("绍兴", "浙江", "shaoxing", 30.0303, 120.5802, False),
    ("嘉兴", "浙江", "jiaxing", 30.7522, 120.7500, False),
    ("湖州", "浙江", "huzhou", 30.8943, 120.0864, False),
    ("金华", "浙江", "jinhua", 29.0784, 119.6474, False),
    ("上海", "上海", "shanghai", 31.2304, 121.4737, True),
    ("苏州", "江苏", "suzhou", 31.2989, 120.5853, True),
    ("南京", "江苏", "nanjing", 32.0603, 118.7969, True),
    ("无锡", "江苏", "wuxi", 31.4912, 120.3119, False),
    ("常州", "江苏", "changzhou", 31.8107, 119.9741, False),
    ("扬州", "江苏", "yangzhou", 32.3942, 119.4129, False),
    ("合肥", "安徽", "hefei", 31.8206, 117.2272, False),
    ("北京", "北京", "beijing", 39.9042, 116.4074, True),
    ("天津", "天津", "tianjin", 39.0842, 117.2009, False),
    ("青岛", "山东", "qingdao", 36.0671, 120.3826, True),
    ("济南", "山东", "jinan", 36.6512, 117.1201, False),
    ("武汉", "湖北", "wuhan", 30.5928, 114.3055, True),
    ("长沙", "湖南", "changsha", 28.2282, 112.9388, True),
    ("成都", "四川", "chengdu", 30.5728, 104.0668, True),
    ("重庆", "重庆", "chongqing", 29.5630, 106.5516, True),
    ("西安", "陕西", "xian", 34.3416, 108.9398, False),
    ("郑州", "河南", "zhengzhou", 34.7466, 113.6254, False),
    ("广州", "广东", "guangzhou", 23.1291, 113.2644, True),
    ("深圳", "广东", "shenzhen", 22.5431, 114.0579, True),
    ("东莞", "广东", "dongguan", 23.0207, 113.7518, False),
    ("佛山", "广东", "foshan", 23.0215, 113.1214, False),
    ("厦门", "福建", "xiamen", 24.4798, 118.0894, True),
    ("福州", "福建", "fuzhou", 26.0745, 119.2965, False),
    ("南昌", "江西", "nanchang", 28.6820, 115.8579, False),
    ("昆明", "云南", "kunming", 25.0389, 102.7183, False),
    ("贵阳", "贵州", "guizhou", 26.6470, 106.6302, False),
    ("大连", "辽宁", "dalian", 38.9140, 121.6147, False),
]

USERS = [
    ("demo@wild.fish", "demo1234", "老钓翁"),
    ("alan@wild.fish", "demo1234", "阿浪"),
    ("xiaoyu@wild.fish", "demo1234", "小鱼儿"),
]

# 点位示例：(城市, 标题, 钓点名, 水域, 收费, 鱼种, 纬度, 经度, 封面, 正文, 摘要)
SPOTS = [
    (
        "杭州", "千岛湖姜家湾：大水面钓翘嘴的黄金湾口", "姜家湾·东南角回水湾", "reservoir", "free",
        ["翘嘴", "鳊鱼", "鲢鳙"], 29.6042, 118.9412, "cover-lake.webp",
        "从姜家镇往东走约 6 公里，见到第一座小桥右转下坡就是湾口。\n\n"
        "这里水深 4-8 米，湾口有缓坡，早晚翘嘴集群明显。建议用 7 克左右亮片，"
        "贴水面快收，太阳出来后就改用米诺慢抽。\n\n"
        "岸边有硬化斜坡，停车方便，适合路亚新手。注意不要在禁渔期下竿。",
        "大水面湾口，早晚翘嘴活跃，岸边好下竿",
    ),
    (
        "杭州", "钱塘江下沙段：夜钓鲈鱼的稳定钓位", "下沙大桥上游 500 米", "river", "free",
        ["鲈鱼", "黄尾", "鲤鱼"], 30.2913, 120.4271, "cover-night.webp",
        "涨潮前后两小时是窗口期，退潮后水流变缓，鲈鱼会回到深水。\n\n"
        "钓组建议 3.5 克铅头钩配软饵，贴底慢拖。夜间照明一定要带够，堤坝湿滑。\n\n"
        "停车在桥下空地，步行 5 分钟到水边。",
        "潮汐窗口明显，夜钓鲈鱼首选",
    ),
    (
        "上海", "滴水湖环湖西路：亲子友好的野钓点", "滴水湖 1 号观景平台", "lake", "free",
        ["鲫鱼", "白条", "鳊鱼"], 30.9072, 121.9325, "cover-pond.webp",
        "环湖步道平整，带小孩也安全，岸边有护栏。\n\n"
        "鱼体偏小，主线 0.8 配袖 3 号钩足够。湖里白条很多，可以用小腥饵打频率。\n\n"
        "周末人多，建议早上 6 点前到，占靠近水草的位置。",
        "步道平整、护栏齐全，适合带娃",
    ),
    (
        "苏州", "太湖东山：荷叶荡里的野生鲫鱼", "东山镇陆巷古村外荡", "lake", "free",
        ["鲫鱼", "鳑鲏", "黑鱼"], 31.0678, 120.2887, "cover-lake.webp",
        "荷叶区边缘找亮水，鲫鱼喜欢在荷叶根茎附近觅食。\n\n"
        "传统钓长竿短线最稳，红虫、蚯蚓都好用。水草多，注意别挂底。\n\n"
        "古村有停车场，收费 10 元/天，附近有农家乐可以补给。",
        "荷叶荡边缘的亮水区，传统钓很稳",
    ),
    (
        "宁波", "四明山仰天湖：山顶水库的清凉钓场", "仰天湖水库东岸", "reservoir", "paid",
        ["鲢鳙", "草鱼", "鲫鱼"], 29.7021, 121.1738, "cover-reservoir.webp",
        "山路十八弯，开车注意刹车水温。水库收费 50 元/天，老板人不错，可以煮面。\n\n"
        "水面大、风大，钓鲢鳙建议用浮钓，水深 3 米左右开始找鱼层。\n\n"
        "夏天山上比市区低 5 度，是避暑钓鱼两不误的地方。",
        "海拔高、水温低，夏天钓鲢鳙舒服",
    ),
    (
        "厦门", "环岛路礁石区：海钓黑鲷的岸钓点", "黄厝海滩北侧礁石", "sea", "free",
        ["黑鲷", "石斑", "海鲈"], 24.4418, 118.1289, "cover-sea.webp",
        "退潮后礁石裸露，是下竿的好时机，涨潮前务必撤离，礁石区涨潮很快。\n\n"
        "矶钓竿 5.3 米，阿波配南极虾，贴礁边放流。挂底较多，多备铅坠。\n\n"
        "一定要穿防滑鞋，最好结伴，手机装防水袋。",
        "退潮窗口下竿，礁石区注意安全",
    ),
    (
        "成都", "龙泉湖：成都周边最稳的黑坑", "龙泉湖 3 号塘", "pond", "paid",
        ["鲤鱼", "草鱼", "罗非"], 30.5542, 104.3291, "cover-pond.webp",
        "黑坑正钓 120 元/4 小时，偷驴 80 元。老板每周二、周五放鱼。\n\n"
        "散炮 + 颗粒是这里的主流打法，抢鱼期前 40 分钟很关键。\n\n"
        "塘边有遮阳棚和热水，冬天也能钓。",
        "放鱼规律稳定，适合练手",
    ),
    (
        "北京", "潮白河顺义段：野钓大鲫的老钓位", "潮白河森林公园北段", "river", "free",
        ["鲫鱼", "鲤鱼", "白条"], 40.1305, 116.7412, "cover-river.webp",
        "河道有缓流，桥墩下游是天然的鱼窝。\n\n"
        "台钓调四钓二，搓饵守底，下午三点后口最好。\n\n"
        "公园停车免费，步行 10 分钟，岸边有台阶。",
        "桥墩下游的缓流区，下午口最好",
    ),
    (
        "杭州", "湘湖东岸：地铁直达的城市野钓点", "湘湖二期东岸亲水平台", "lake", "free",
        ["鲫鱼", "白条", "鳊鱼"], 30.1521, 120.2263, "cover-lake.webp",
        "地铁 1 号线湘湖站出来骑车 10 分钟，岸边有亲水平台，适合下班后钓两小时。\n\n"
        "水不深，1.5 米左右，小鲫鱼为主，用拉饵打频率最有效。周末亲子露营的人多，注意安全。\n\n"
        "附近有便利店，补给方便。",
        "地铁直达，下班后两小时的解压钓点",
    ),
    (
        "杭州", "富春江桐庐段：流水钓鳊鱼的老口岸", "桐庐富春江一桥下游", "river", "free",
        ["鳊鱼", "翘嘴", "黄尾"], 29.7972, 119.6912, "cover-river.webp",
        "江水有流速，需要用重铅到底，钓离底 20 公分。\n\n"
        "鳊鱼喜欢在有缓流的回水湾，桥墩下游第二个湾子最好。玉米粒做饵，几乎不闹小鱼。\n\n"
        "桥头有停车位，步行下堤 3 分钟。汛期水位上涨不要下竿。",
        "富春江的缓流回湾，玉米守鳊鱼",
    ),
    (
        "杭州", "青山湖水库：周末守鲢鳙的大水面", "青山湖水库北岸", "reservoir", "paid",
        ["鲢鳙", "草鱼", "鲤鱼"], 30.2458, 119.7215, "cover-reservoir.webp",
        "库区收费 60 元/天，可以开车到岸边，装备多也不怕。\n\n"
        "水面大，钓鲢鳙要打窝引鱼，浮钓 2-3 米找鱼层。风浪大时换重坠。\n\n"
        "夏天蚊虫多，驱蚊液必备；周边有农家乐可以吃饭。",
        "车能开到岸边，适合带一堆装备",
    ),
    (
        "杭州", "余杭老王黑坑：新手练手首选", "余杭区良渚老王垂钓园", "pond", "paid",
        ["鲤鱼", "罗非", "草鱼"], 30.3921, 120.0123, "cover-pond.webp",
        "正钓 100 元/4 小时，鱼的密度高，新手也能有口。\n\n"
        "老板每周三、周六放鱼，放鱼当天用颗粒钓浮，第二天转钓底。\n\n"
        "有遮阳棚、热水和厕所，带家人来也不无聊。",
        "密度高、设施全，适合练手",
    ),
    (
        "杭州", "千岛湖界首：车能开到水边的露营钓", "淳安界首乡沿湖营地", "lake", "free",
        ["翘嘴", "鳊鱼", "黄尾"], 29.7231, 118.9722, "cover-night.webp",
        "沿湖有多个免费营位，可以车泊过夜，适合周末两天一夜。\n\n"
        "清晨和傍晚是窗口期，路亚翘嘴用亮片，手竿守鳊鱼用玉米。\n\n"
        "营地无补给，水和食物要带够；垃圾务必带走。",
        "可车泊过夜的湖边营地",
    ),
]

COMMENTS = [
    ("demo@wild.fish", "上周去了，湾口确实有翘嘴，就是风大。", None),
    ("alan@wild.fish", "请问停车是在桥下还是村口？", None),
    ("xiaoyu@wild.fish", "桥下有空地，能停七八辆。", "alan@wild.fish"),
    ("alan@wild.fish", "周末人有点多，建议早点去占位。", None),
]


def seed_cities(db) -> None:
    existing = {name for name in db.scalars(select(City.name)).all()}
    for name, province, pinyin, lat, lng, is_hot in CITIES:
        if name in existing:
            continue
        db.add(
            City(
                name=name,
                province=province,
                pinyin=pinyin,
                lat=Decimal(str(lat)),
                lng=Decimal(str(lng)),
                is_hot=is_hot,
            )
        )
    db.commit()


def seed_users(db) -> dict[str, User]:
    users: dict[str, User] = {}
    for email, password, nickname in USERS:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(email=email, nickname=nickname, password_hash=hash_password(password))
            db.add(user)
            db.commit()
            db.refresh(user)
        users[email] = user
    return users


def seed_spots(db, users: dict[str, User]) -> list[Spot]:
    cities = {city.name: city for city in db.scalars(select(City)).all()}
    created: list[Spot] = []
    author_pool = list(users.values())

    for index, item in enumerate(SPOTS):
        (
            city_name, title, location, water, fee, fish, lat, lng, cover, content, summary
        ) = item
        existing = db.scalar(select(Spot).where(Spot.title == title))
        if existing:
            created.append(existing)
            continue

        spot = Spot(
            city_id=cities[city_name].id,
            author_id=author_pool[index % len(author_pool)].id,
            title=title,
            summary=summary,
            content=content,
            cover_url=f"/static/covers/{cover}",
            location_name=location,
            address=f"{city_name} · {location}",
            lat=Decimal(str(lat)),
            lng=Decimal(str(lng)),
            water_type=water,
            fee_type=fee,
            fish_types=fish,
            # 让种子数据分布在最近几天，热度排序才有层次
            created_at=datetime.now(UTC).replace(tzinfo=None) - timedelta(days=index, hours=index * 3),
        )
        db.add(spot)
        db.commit()
        db.refresh(spot)
        created.append(spot)

    return created


def seed_interactions(db, users: dict[str, User], spots: list[Spot]) -> None:
    """给点位补充评论、评分和热度事件，让列表页有真实的排名差异。

    逐条判断是否已有数据，因此可以反复执行：新增点位后重跑只会补该点位的数据。
    """
    pool = list(users.values())
    now = datetime.now(UTC).replace(tzinfo=None)
    scores = [5.0, 4.0, 4.5, 5.0]

    for spot_index, spot in enumerate(spots):
        has_rating = db.scalar(select(Rating.id).where(Rating.spot_id == spot.id).limit(1))
        if not has_rating:
            total = 0.0
            for user_index, user in enumerate(pool):
                score = scores[(spot_index + user_index) % len(scores)]
                db.add(Rating(spot_id=spot.id, user_id=user.id, score=score))
                total += score
            spot.rating_count = len(pool)
            spot.rating_sum = int(total)
            spot.rating_avg = round(total / len(pool), 2)

        has_comment = db.scalar(select(Comment.id).where(Comment.spot_id == spot.id).limit(1))
        if not has_comment:
            for offset, (email, content, reply_to) in enumerate(COMMENTS[: 2 + spot_index % 2]):
                parent_id = None
                if reply_to:
                    parent = db.scalar(
                        select(Comment).where(
                            Comment.spot_id == spot.id, Comment.user_id == users[reply_to].id
                        )
                    )
                    parent_id = parent.id if parent else None
                db.add(
                    Comment(
                        spot_id=spot.id,
                        user_id=users[email].id,
                        content=content,
                        parent_id=parent_id,
                        created_at=now - timedelta(hours=offset * 5 + spot_index),
                    )
                )
                spot.comment_count += 1

        has_event = db.scalar(select(SpotEvent.id).where(SpotEvent.spot_id == spot.id).limit(1))
        if not has_event:
            for i in range(6 + spot_index * 4):
                db.add(
                    SpotEvent(
                        spot_id=spot.id,
                        user_id=pool[i % len(pool)].id,
                        event_type="view",
                        weight=1,
                        created_at=now - timedelta(hours=i * 6),
                    )
                )
            for i in range(3):
                db.add(
                    SpotEvent(
                        spot_id=spot.id,
                        user_id=pool[i % len(pool)].id,
                        event_type="comment",
                        weight=3,
                        created_at=now - timedelta(hours=i * 8),
                    )
                )
            spot.view_count = 20 + spot_index * 12

    db.commit()


def main() -> None:
    with SessionLocal() as db:
        seed_cities(db)
        users = seed_users(db)
        spots = seed_spots(db, users)
        seed_interactions(db, users, spots)
        city_total = db.scalar(select(func.count()).select_from(City)) or 0
        print(f"城市 {city_total} 个、用户 {len(users)} 个、点位 {len(spots)} 个")
        print("种子数据完成。示例账号：demo@wild.fish / demo1234")


if __name__ == "__main__":
    main()
