/*
 Navicat Premium Data Transfer

 Source Server         : 192.168.21.146-3307
 Source Server Type    : MySQL
 Source Server Version : 80046 (8.0.46)
 Source Host           : 192.168.21.146:3307
 Source Schema         : campus_market

 Target Server Type    : MySQL
 Target Server Version : 80046 (8.0.46)
 File Encoding         : 65001

 Date: 04/09/2026 21:46:14
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
  `create_time` datetime NOT NULL DEFAULT 'now()',
  `update_time` datetime NOT NULL DEFAULT 'now()',
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of category
-- ----------------------------
INSERT INTO `category` VALUES (1, '书籍教材', 1, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);
INSERT INTO `category` VALUES (2, '数码产品', 2, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);
INSERT INTO `category` VALUES (3, '服饰鞋包', 3, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);
INSERT INTO `category` VALUES (4, '生活用品', 4, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);
INSERT INTO `category` VALUES (5, '运动健身', 5, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);
INSERT INTO `category` VALUES (6, '其他', 6, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);

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
  `create_time` datetime NOT NULL DEFAULT 'now()',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_chat_message_receiver_id`(`receiver_id` ASC) USING BTREE,
  INDEX `ix_chat_message_sender_id`(`sender_id` ASC) USING BTREE,
  CONSTRAINT `chat_message_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chat_message_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of chat_message
-- ----------------------------
INSERT INTO `chat_message` VALUES (1, 4, 3, '你好，书还在吗', 1, '2026-09-04 16:37:47');

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
  `create_time` datetime NOT NULL DEFAULT 'now()',
  `update_time` datetime NOT NULL DEFAULT 'now()',
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_goods_user_id`(`user_id` ASC) USING BTREE,
  INDEX `ix_goods_category_id`(`category_id` ASC) USING BTREE,
  CONSTRAINT `goods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `goods_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of goods
-- ----------------------------
INSERT INTO `goods` VALUES (1, 3, 1, '高等数学教材', '九成新', 25.00, 45.00, 2, 2, '2026-09-04 16:37:46', '2026-09-04 16:37:46', 0);

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
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of goods_image
-- ----------------------------
INSERT INTO `goods_image` VALUES (1, 1, '/uploads/464c7b1e5d8c4705a6bf7887bf04ca66.png', 0);

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
  `create_time` datetime NOT NULL DEFAULT 'now()',
  `update_time` datetime NOT NULL DEFAULT 'now()',
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `ix_orders_goods_id`(`goods_id` ASC) USING BTREE,
  INDEX `ix_orders_buyer_id`(`buyer_id` ASC) USING BTREE,
  INDEX `ix_orders_seller_id`(`seller_id` ASC) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (1, '202609041637469d08a893', 1, 3, 4, 25.00, 1, '2026-09-04 16:37:46', '2026-09-04 16:37:47', 0);

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
  `create_time` datetime NOT NULL DEFAULT 'now()',
  `update_time` datetime NOT NULL DEFAULT 'now()',
  `is_deleted` smallint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'admin', '$2b$12$MD8P9/.SBnXFoD0238om5uJsx2n99sv.nN.hKyh/bi46teYtF1o26', '管理员', '', '', 1, 0, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);
INSERT INTO `user` VALUES (2, 'test', '$2b$12$5fv38L5rHaiE2I0MGkCw7.c6BxNvDG/ZDOUzE0ZwokgYLf0jWklha', '测试学生', '', '', 0, 0, '2026-09-04 16:33:12', '2026-09-04 16:33:12', 0);
INSERT INTO `user` VALUES (3, 'stu1', '$2b$12$zHqOkxutNviaNytKif5O6eIZ4.1.jLQacg/DaWzWXIsj/exNYPryW', 'stu1同学', '', '', 0, 0, '2026-09-04 16:37:43', '2026-09-04 16:37:43', 0);
INSERT INTO `user` VALUES (4, 'stu2', '$2b$12$jfiupvfWohaKbcjt47usUOpfb62JkaJm7f4g004Nl2hO5z9VdR/GC', 'stu2同学', '', '', 0, 0, '2026-09-04 16:37:44', '2026-09-04 16:37:44', 0);

-- ----------------------------
-- Table structure for user_favorite
-- ----------------------------
DROP TABLE IF EXISTS `user_favorite`;
CREATE TABLE `user_favorite`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `goods_id` bigint NOT NULL,
  `create_time` datetime NOT NULL DEFAULT 'now()',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_goods`(`user_id` ASC, `goods_id` ASC) USING BTREE,
  INDEX `ix_user_favorite_user_id`(`user_id` ASC) USING BTREE,
  INDEX `ix_user_favorite_goods_id`(`goods_id` ASC) USING BTREE,
  CONSTRAINT `user_favorite_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `user_favorite_ibfk_2` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_favorite
-- ----------------------------
INSERT INTO `user_favorite` VALUES (1, 4, 1, '2026-09-04 16:37:46');

SET FOREIGN_KEY_CHECKS = 1;
