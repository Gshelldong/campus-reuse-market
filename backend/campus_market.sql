/*
 Navicat Premium Data Transfer

 Source Server         : 3307-192.168.124.50
 Source Server Type    : MySQL
 Source Server Version : 80046 (8.0.46)
 Source Host           : 192.168.124.50:3307
 Source Schema         : campus_market

 Target Server Type    : MySQL
 Target Server Version : 80046 (8.0.46)
 File Encoding         : 65001

 Date: 05/09/2026 21:27:44
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for category
-- ----------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `sort` int NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of category
-- ----------------------------
INSERT INTO `category` VALUES (1, '书籍教材', 1, '2026-09-04 22:36:30', '2026-09-04 22:36:30', 0);
INSERT INTO `category` VALUES (2, '数码产品', 2, '2026-09-04 22:36:30', '2026-09-04 22:36:30', 0);
INSERT INTO `category` VALUES (3, '服饰鞋包', 3, '2026-09-04 22:36:30', '2026-09-04 22:36:30', 0);
INSERT INTO `category` VALUES (4, '生活用品', 4, '2026-09-04 22:36:30', '2026-09-04 22:36:30', 0);
INSERT INTO `category` VALUES (5, '运动健身', 5, '2026-09-04 22:36:30', '2026-09-04 22:36:30', 0);
INSERT INTO `category` VALUES (6, '其他', 6, '2026-09-04 22:36:30', '2026-09-04 22:36:30', 0);

-- ----------------------------
-- Table structure for chat_message
-- ----------------------------
DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_read` smallint NOT NULL COMMENT '0未读 1已读',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_chat_message_receiver_id`(`receiver_id` ASC) USING BTREE,
  INDEX `ix_chat_message_sender_id`(`sender_id` ASC) USING BTREE,
  CONSTRAINT `chat_message_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chat_message_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_message
-- ----------------------------
INSERT INTO `chat_message` VALUES (1, 1, 3, '你好', 1, '2026-09-05 08:43:20');
INSERT INTO `chat_message` VALUES (2, 3, 1, '有什么需要了解的？', 1, '2026-09-05 08:44:15');
INSERT INTO `chat_message` VALUES (3, 1, 3, 'jsjsjsj', 1, '2026-09-05 15:35:09');
INSERT INTO `chat_message` VALUES (4, 1, 3, '123456', 1, '2026-09-05 15:35:14');
INSERT INTO `chat_message` VALUES (5, 3, 1, '你好请问你的衣服怎么卖？', 1, '2026-09-05 18:45:12');
INSERT INTO `chat_message` VALUES (6, 3, 1, '我正在看「杯子」，商品链接：http://localhost:4200/goods/3', 1, '2026-09-05 19:39:57');

-- ----------------------------
-- Table structure for goods
-- ----------------------------
DROP TABLE IF EXISTS `goods`;
CREATE TABLE `goods`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `price` decimal(10, 2) NOT NULL,
  `original_price` decimal(10, 2) NULL DEFAULT NULL,
  `condition` smallint NOT NULL COMMENT '新旧程度 1全新 2九成新 3八成新...',
  `status` smallint NOT NULL COMMENT '0待审核 1上架 2已售出 3下架',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_goods_category_id`(`category_id` ASC) USING BTREE,
  INDEX `ix_goods_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `goods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `goods_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of goods
-- ----------------------------
INSERT INTO `goods` VALUES (1, 3, 2, '小米16', '8成新', 1800.01, 5600.00, 2, 1, '2026-09-05 08:33:02', '2026-09-05 18:22:15', 0);
INSERT INTO `goods` VALUES (2, 1, 6, '哇哈哈', '饮料', 2.00, 8.80, 1, 2, '2026-09-05 14:39:37', '2026-09-05 19:40:30', 0);
INSERT INTO `goods` VALUES (3, 1, 4, '杯子', '全新杯子', 2.00, 24.00, 2, 1, '2026-09-05 15:23:33', '2026-09-05 15:23:33', 0);
INSERT INTO `goods` VALUES (4, 1, 4, '被子', '冬天盖的被子', 12.00, 80.56, 2, 1, '2026-09-05 15:24:15', '2026-09-05 15:24:15', 0);
INSERT INTO `goods` VALUES (5, 1, 4, '缝纫机', '家传缝纫机', 100.00, 1999.00, 3, 1, '2026-09-05 15:24:57', '2026-09-05 15:24:57', 0);
INSERT INTO `goods` VALUES (6, 1, 3, '衣服', '很新的衣服，10元一件很自提。', 20.00, 99.00, 2, 1, '2026-09-05 15:26:34', '2026-09-05 15:26:34', 0);
INSERT INTO `goods` VALUES (7, 1, 4, '自行车', '自行车，很新，喜欢的交流。', 299.00, 3000.00, 2, 1, '2026-09-05 15:27:20', '2026-09-05 15:27:20', 0);
INSERT INTO `goods` VALUES (8, 1, 4, '钟表', '祖传钟表，不喜勿扰。', 89.00, 254.00, 2, 2, '2026-09-05 15:27:52', '2026-09-05 21:03:53', 0);
INSERT INTO `goods` VALUES (9, 3, 1, '各种书', '各种书10元1本自选！！！\r\n', 10.00, 99.00, 2, 1, '2026-09-05 18:32:44', '2026-09-05 18:34:10', 0);
INSERT INTO `goods` VALUES (10, 3, 1, '大学物理', '物理书', 23.80, 64.00, 2, 1, '2026-09-05 18:33:11', '2026-09-05 18:34:10', 0);
INSERT INTO `goods` VALUES (11, 3, 1, '高等数学', '数学', 50.00, 105.00, 2, 1, '2026-09-05 18:33:38', '2026-09-05 18:34:09', 0);
INSERT INTO `goods` VALUES (12, 4, 5, '杠铃', '二手杠铃一套，成色实拍，正常使用无变形裂纹。\r\n家用健身够用，重量可调节，自提优先，诚心出。', 10.00, 58.00, 2, 1, '2026-09-05 20:08:03', '2026-09-05 20:08:26', 0);
INSERT INTO `goods` VALUES (13, 4, 5, '健身器', '家用闲置健身器，锻炼没坚持下来，闲置转让。\r\n完好无弯曲，配件齐全，重量可调。\r\n不邮寄，自提，到手直接练。', 120.00, 288.00, 2, 1, '2026-09-05 20:10:25', '2026-09-05 20:11:42', 0);
INSERT INTO `goods` VALUES (14, 4, 5, '单双杠', '健身房倒闭，运动器材便宜卖。', 500.00, 2874.00, 2, 1, '2026-09-05 20:21:24', '2026-09-05 20:21:36', 0);

-- ----------------------------
-- Table structure for goods_image
-- ----------------------------
DROP TABLE IF EXISTS `goods_image`;
CREATE TABLE `goods_image`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `goods_id` bigint NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `sort` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_goods_image_goods_id`(`goods_id` ASC) USING BTREE,
  CONSTRAINT `goods_image_ibfk_1` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of goods_image
-- ----------------------------
INSERT INTO `goods_image` VALUES (1, 1, '/uploads/72cf0ad074f44cd8ac380ff80d65b973.png', 0);
INSERT INTO `goods_image` VALUES (2, 1, '/uploads/e917f385d9f84c0195ee4164b755f864.png', 1);
INSERT INTO `goods_image` VALUES (3, 2, '/uploads/5211962705e6412688741b5dec65ccdc.jpg', 0);
INSERT INTO `goods_image` VALUES (4, 3, '/uploads/7e466bebfaca4341839c59c1bdcd7692.jpeg', 0);
INSERT INTO `goods_image` VALUES (5, 4, '/uploads/d6f4e1232b204b0298f83b94e3a6f25e.jpeg', 0);
INSERT INTO `goods_image` VALUES (6, 5, '/uploads/af9b92dd94a0455a99677910bdbb321e.jpeg', 0);
INSERT INTO `goods_image` VALUES (7, 6, '/uploads/57da3e4d292f47e4b77a5926ceab70b5.jpeg', 0);
INSERT INTO `goods_image` VALUES (8, 7, '/uploads/6b13edd7b6ca42149b4c9c2affb81b82.jpg', 0);
INSERT INTO `goods_image` VALUES (9, 8, '/uploads/ced6be553f45459db9e22c1dfc07d986.jpg', 0);
INSERT INTO `goods_image` VALUES (10, 9, '/uploads/ac1e820779c4401f9dd434f21bfd255a.jpg', 0);
INSERT INTO `goods_image` VALUES (11, 10, '/uploads/46599d23ab5443da9c6b6bcc6d92b284.jpg', 0);
INSERT INTO `goods_image` VALUES (12, 11, '/uploads/74405d0e31f4494ea762d5be9858d68c.jpg', 0);
INSERT INTO `goods_image` VALUES (13, 12, '/uploads/0b80a9117c914625a11727666d7793f2.jpg', 0);
INSERT INTO `goods_image` VALUES (14, 13, '/uploads/2e3b77753bd9451399d144d02a0c0302.jpg', 0);
INSERT INTO `goods_image` VALUES (15, 14, '/uploads/3a7f46e824ce484d97978af66431ebd8.jpeg', 0);

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `goods_id` bigint NOT NULL,
  `seller_id` bigint NOT NULL,
  `buyer_id` bigint NOT NULL,
  `price` decimal(10, 2) NOT NULL,
  `status` smallint NOT NULL COMMENT '0待确认 1交易完成 2取消',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `ix_orders_buyer_id`(`buyer_id` ASC) USING BTREE,
  INDEX `ix_orders_seller_id`(`seller_id` ASC) USING BTREE,
  INDEX `ix_orders_goods_id`(`goods_id` ASC) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (1, '20260905193100d4baf938', 2, 1, 3, 2.00, 2, '2026-09-05 19:31:27', '2026-09-05 19:32:53', 0);
INSERT INTO `orders` VALUES (2, '202609051940030ddf4581', 2, 1, 3, 2.00, 1, '2026-09-05 19:40:30', '2026-09-05 19:46:18', 0);
INSERT INTO `orders` VALUES (3, '2026090520245602d07daa', 8, 1, 4, 89.00, 2, '2026-09-05 20:25:23', '2026-09-05 20:26:48', 0);
INSERT INTO `orders` VALUES (4, '202609052026334157d0bf', 8, 1, 4, 89.00, 2, '2026-09-05 20:27:00', '2026-09-05 20:50:35', 0);
INSERT INTO `orders` VALUES (5, '20260905205034d44fef6d', 8, 1, 4, 89.00, 2, '2026-09-05 20:51:02', '2026-09-05 20:52:41', 0);
INSERT INTO `orders` VALUES (6, '202609052052445fcde099', 8, 1, 4, 89.00, 2, '2026-09-05 20:53:12', '2026-09-05 20:57:19', 0);
INSERT INTO `orders` VALUES (7, '202609052056572be28c58', 8, 1, 4, 89.00, 2, '2026-09-05 20:57:24', '2026-09-05 21:03:43', 0);
INSERT INTO `orders` VALUES (8, '20260905210326f04c27ee', 8, 1, 4, 89.00, 1, '2026-09-05 21:03:53', '2026-09-05 21:05:22', 0);

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `role` smallint NOT NULL COMMENT '0普通学生 1管理员',
  `status` smallint NOT NULL COMMENT '0正常 1禁用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'admin', '$2b$12$cP0kmLXqbDPVOJKZ6mklQetKR9N5ll1Q0slMZIM15DPlQgt5NaIgm', '管理员', '/uploads/d1b8f3fa38504b43a47c750dfc7ee52c.png', '', 1, 0, '2026-09-04 22:36:30', '2026-09-05 15:43:27', 0);
INSERT INTO `user` VALUES (2, 'test', '$2b$12$JVskvL.nKugGigNSznGO/ODBxyj6VKTsbmtsW2iVAgVo40PHi12gK', '测试学生', '', '', 0, 0, '2026-09-04 22:36:30', '2026-09-04 22:36:30', 0);
INSERT INTO `user` VALUES (3, 'user1', '$2b$12$ftislaM/j.pruGtzQspr9ecWSvjqa7EMw/OjlrO.728vsioTm28me', 'xiaoxiao', '/uploads/71f81e396545491b9f8240ec00c6623a.png', '13048303441', 0, 0, '2026-09-05 08:30:15', '2026-09-05 11:56:28', 0);
INSERT INTO `user` VALUES (4, 'user2', '$2b$12$pP2FhIQOhqWa5tTLUZYBPe3VhkXcYmyA7kxyWPgYaslYDqv/dveW2', '晓铃', '/uploads/8b43375ac2f141d2b2e3d1d47c1c8c0a.jpeg', '13048303541', 0, 0, '2026-09-05 20:04:12', '2026-09-05 20:06:10', 0);

-- ----------------------------
-- Table structure for user_favorite
-- ----------------------------
DROP TABLE IF EXISTS `user_favorite`;
CREATE TABLE `user_favorite`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `goods_id` bigint NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_goods`(`user_id` ASC, `goods_id` ASC) USING BTREE,
  INDEX `ix_user_favorite_goods_id`(`goods_id` ASC) USING BTREE,
  INDEX `ix_user_favorite_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `user_favorite_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `user_favorite_ibfk_2` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_favorite
-- ----------------------------
INSERT INTO `user_favorite` VALUES (3, 1, 1, '2026-09-05 19:46:45');
INSERT INTO `user_favorite` VALUES (4, 3, 8, '2026-09-05 19:47:58');
INSERT INTO `user_favorite` VALUES (5, 3, 5, '2026-09-05 19:49:23');

SET FOREIGN_KEY_CHECKS = 1;
