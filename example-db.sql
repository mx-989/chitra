-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3307
-- Generation Time: Jun 20, 2025 at 21:33 PM
-- Server version: 9.2.0
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
CREATE DATABASE IF NOT EXISTS `ProjektPhoto`;
USE `ProjektPhoto`;

--
-- Database: `ProjektPhoto`
--

-- --------------------------------------------------------

--
-- Table structure for table `albums`
--

CREATE TABLE `albums` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tags` json DEFAULT NULL,
  `visibility` enum('private','public','restricted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'private',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `albums`
--

INSERT INTO `albums` (`id`, `user_id`, `title`, `description`, `tags`, `visibility`, `created_at`, `updated_at`) VALUES
(48, 15, 'Montagne', 'Mes vacanses à la montagne!', '[]', 'private', '2025-05-04 09:47:46', '2025-05-04 09:47:46'),
(49, 15, 'Mes Créations', 'humeur d\'artiste', '[]', 'private', '2025-05-03 23:52:30', '2025-05-03 23:52:30'),
(50, 16, 'Paysages de vacanses', 'a la mer et dans la foret', '[]', 'private', '2025-05-01 23:27:37', '2025-05-01 23:27:37'),
(51, 16, 'Famille', 'nos photos ensemble', '[]', 'private', '2025-05-04 08:52:20', '2025-05-04 08:52:20');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int NOT NULL,
  `photo_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `photo_id`, `user_id`, `content`, `created_at`, `updated_at`) VALUES
(76, 235, 15, 'Très beau!', '2025-06-20 15:29:22', '2025-06-20 15:29:22'),
(77, 235, 16, 'Merci!', '2025-06-20 18:29:22', '2025-06-20 18:29:22');

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `photo_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `photo_id`, `created_at`) VALUES
(285, 15, 233, '2025-06-20 13:04:35'),
(286, 15, 228, '2025-06-20 13:42:57'),
(287, 15, 244, '2025-06-20 13:21:00'),
(288, 15, 239, '2025-06-20 13:36:10'),
(289, 15, 248, '2025-06-20 13:57:50'),
(290, 15, 249, '2025-06-20 13:00:41'),
(291, 16, 253, '2025-06-20 13:09:56'),
(292, 16, 238, '2025-06-20 13:47:36');

-- --------------------------------------------------------

--
-- Table structure for table `photos`
--

CREATE TABLE `photos` (
  `id` int NOT NULL,
  `album_id` int NOT NULL,
  `uploaded_by` int NOT NULL,
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tags` json DEFAULT NULL,
  `date_taken` datetime DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `file_size` bigint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `photos`
--

INSERT INTO `photos` (`id`, `album_id`, `uploaded_by`, `filename`, `description`, `tags`, `date_taken`, `uploaded_at`, `file_size`) VALUES
(227, 48, 15, '685e419da0024_1750431881.png', 'Montagne Verte', '[\"montagne\", \"vacanses\"]', '2025-05-04 15:15:44', '2025-05-04 13:15:44', 983269),
(228, 48, 15, '685e41d5ee846_1750430644.jpg', 'Montagne Epoustouflante', '[\"montagne\", \"vacanses\"]', '2025-05-05 16:44:51', '2025-05-05 14:44:51', 115451),
(229, 48, 15, '685e41f0809be_1750430813.jpg', 'Montagne Blanche', '[\"montagne\", \"vacanses\"]', '2025-05-06 12:50:46', '2025-05-06 10:50:46', 1583170),
(230, 48, 15, '685e420f4367c_1750430195.jpg', 'Montagne boisée', '[\"montagne\", \"vacanses\"]', '2025-05-06 21:20:57', '2025-05-06 19:20:57', 1847928),
(231, 49, 15, '685e4333228db_1750431905.png', 'dessin de luma', '[\"dessin\"]', '2025-01-01 22:26:06', '2025-02-01 16:56:34', 16572),
(232, 49, 15, '685e434499872_1750430437.jpg', 'dessin bubble tea', '[\"dessin\"]', '2025-03-21 19:00:00', '2025-03-21 18:00:00', 92612),
(233, 49, 15, '685e43a504434_1750431739.png', 'dessin anatomie', '[\"dessin\", \"oeil\"]', '2025-02-04 19:47:11', '2025-02-04 19:18:25', 37836),
(235, 50, 16, '685e4617e2dd0_1750431301.jpg', '', '[\"Mer\", \"vacanses\"]', '2025-05-04 20:49:53', '2025-05-04 18:49:53', 2330896),
(236, 50, 16, '685e461810987_1750431566.jpg', '', '[\"Mer\", \"vacanses\"]', '2025-05-06 17:58:08', '2025-05-06 15:58:08', 75283),
(237, 50, 16, '685e461810973_1750432256.jpg', '', '[\"Mer\", \"vacanses\"]', '2025-05-04 09:55:42', '2025-05-04 07:55:42', 108244),
(238, 50, 16, '685e4618058db_1750432900.png', '', '[\"Mer\", \"vacanses\"]', '2025-05-06 02:55:12', '2025-05-06 00:55:12', 53584),
(239, 50, 16, '685e461812093_1750433080.png', '', '[\"Mer\", \"vacanses\"]', '2025-05-05 14:07:37', '2025-05-05 12:07:37', 52804),
(244, 50, 16, '685e4686d2a02_1750432891.jpg', 'forêt', '[\"vacanses\", \"arbres\"]', '2025-05-04 02:08:04', '2025-05-04 00:08:04', 1588354),
(245, 50, 16, '685e46879ec9d_1750430804.jpg', 'forêt', '[\"vacanses\", \"arbres\"]', '2025-05-06 09:24:48', '2025-05-06 07:24:48', 27005350),
(246, 50, 16, '685e468710927_1750431739.jpg', 'forêt', '[\"vacanses\", \"arbres\"]', '2025-05-04 15:38:47', '2025-05-04 13:38:47', 16349027),
(247, 50, 16, '685e468747380_1750432748.jpg', 'forêt', '[\"vacanses\", \"arbres\"]', '2025-05-06 20:33:45', '2025-05-06 18:33:45', 17596717),
(248, 49, 15, '685e480864c99_1750431660.gif', 'Chien qui danse', '[\"chien\"]', '2025-06-03 07:28:08', '2025-06-03 07:28:08', 934314),
(249, 51, 16, '685e495f4b778_1750430863.jpg', '', '[\"famille\"]', '2025-06-10 20:05:53', '2025-06-10 18:05:53', 2497327),
(250, 51, 16, '685e495f3325e_1750432341.png', '', '[\"famille\"]', '2025-06-10 22:47:24', '2025-06-10 20:47:24', 194887),
(251, 51, 15, '685e49745f2af_1750430233.jpg', '', '[\"famille\"]', '2025-06-10 05:39:21', '2025-06-10 03:39:21', 400911),
(253, 51, 15, '685e4983daeb6_1750432622.jpg', '', '[\"famille\"]', '2025-06-10 07:54:34', '2025-06-10 05:54:34', 373510);

-- --------------------------------------------------------

--
-- Table structure for table `shares`
--

CREATE TABLE `shares` (
  `id` int NOT NULL,
  `album_id` int NOT NULL,
  `user_id` int NOT NULL,
  `permission` enum('view','comment','add') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'view',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `shares`
--

INSERT INTO `shares` (`id`, `album_id`, `user_id`, `permission`, `created_at`) VALUES
(16, 50, 15, 'comment', '2025-06-20 13:22:37'),
(17, 51, 15, 'add', '2025-06-20 13:24:10');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `created_at`, `updated_at`) VALUES
(15, 'mathieu.alami@chitra.net', '$2y$10$rVNA6crT8Tn3Mx.MPzXDPecIGHVxPdJlhfTE2Fiy5xx7K0cVn5cxi', 'Mathieu Alami', '2025-06-19 14:43:03', '2025-06-19 14:43:03'),
(16, 'elodie.baker@chitra.net', '$2y$10$KxcAqwkLzkwkzbC86ZKSbukcWGKX3W.wkr1rWQdBg1wKBNJWBx3Zq', 'Élodie Baker', '2025-06-19 13:15:34', '2025-06-19 13:15:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `albums`
--
ALTER TABLE `albums`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_visibility` (`visibility`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_photo_id` (`photo_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`user_id`,`photo_id`),
  ADD KEY `photo_id` (`photo_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `photos`
--
ALTER TABLE `photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_album_id` (`album_id`),
  ADD KEY `idx_uploaded_by` (`uploaded_by`),
  ADD KEY `idx_date_taken` (`date_taken`);

--
-- Indexes for table `shares`
--
ALTER TABLE `shares`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_share` (`album_id`,`user_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `albums`
--
ALTER TABLE `albums`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=294;

--
-- AUTO_INCREMENT for table `photos`
--
ALTER TABLE `photos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=256;

--
-- AUTO_INCREMENT for table `shares`
--
ALTER TABLE `shares`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `albums`
--
ALTER TABLE `albums`
  ADD CONSTRAINT `albums_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `photos`
--
ALTER TABLE `photos`
  ADD CONSTRAINT `photos_ibfk_1` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `photos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shares`
--
ALTER TABLE `shares`
  ADD CONSTRAINT `shares_ibfk_1` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shares_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
