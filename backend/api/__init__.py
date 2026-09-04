from api import auth, user, goods, category, favorite, order, chat, upload

api_routers = [
    auth.router,
    user.router,
    goods.router,
    category.router,
    favorite.router,
    order.router,
    chat.router,
    upload.router,
]
