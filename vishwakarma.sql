-- MySQL dump 10.13  Distrib 8.0.24, for Win64 (x86_64)
--
-- Host: localhost    Database: vishwakarmadb
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `clientrequirements`
--

DROP TABLE IF EXISTS `clientrequirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientrequirements` (
  `requirementId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) DEFAULT NULL,
  `siteId` varchar(50) DEFAULT NULL,
  `details` varchar(600) DEFAULT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`requirementId`),
  KEY `fk_clientreq_company` (`companyId`),
  KEY `fk_clientreq_site` (`siteId`),
  CONSTRAINT `fk_clientreq_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_clientreq_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `companyId` varchar(50) NOT NULL,
  `companyName` varchar(255) NOT NULL,
  `contactPerson` varchar(255) DEFAULT NULL,
  `contactEmail` varchar(255) DEFAULT NULL,
  `contactPhone` varchar(20) DEFAULT NULL,
  `address` text,
  `subscriptionEndDate` varchar(20) DEFAULT NULL,
  `status` enum('Active','InActive') DEFAULT 'Active',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emailotps`
--

DROP TABLE IF EXISTS `emailotps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emailotps` (
  `otpId` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`otpId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employeeId` varchar(20) NOT NULL,
  `companyId` varchar(50) NOT NULL,
  `employeeName` varchar(255) NOT NULL,
  `role` varchar(100) NOT NULL,
  `phoneNumber` varchar(20) DEFAULT NULL,
  `status` enum('active','standBy','onLeave') DEFAULT 'active',
  `assignedSiteId` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`employeeId`,`companyId`),
  KEY `fk_employees_company` (`companyId`),
  KEY `fk_employees_site` (`assignedSiteId`),
  CONSTRAINT `fk_employees_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_employees_site` FOREIGN KEY (`assignedSiteId`) REFERENCES `sites` (`siteId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `siteactivity`
--

DROP TABLE IF EXISTS `siteactivity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `siteactivity` (
  `activityId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) DEFAULT NULL,
  `siteId` varchar(50) DEFAULT NULL,
  `activityDate` date DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`activityId`),
  KEY `fk_siteactivity_company` (`companyId`),
  KEY `fk_siteactivity_site` (`siteId`),
  CONSTRAINT `fk_siteactivity_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_siteactivity_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sitematerials`
--

DROP TABLE IF EXISTS `sitematerials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sitematerials` (
  `materialId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) DEFAULT NULL,
  `siteId` varchar(50) DEFAULT NULL,
  `itemName` varchar(255) NOT NULL,
  `quantity` varchar(100) DEFAULT NULL,
  `status` enum('Available','Low Stock','Out of Stock') DEFAULT 'Available',
  PRIMARY KEY (`materialId`),
  KEY `fk_sitematerials_company` (`companyId`),
  KEY `fk_sitematerials_site` (`siteId`),
  CONSTRAINT `fk_sitematerials_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_sitematerials_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `siteperformance`
--

DROP TABLE IF EXISTS `siteperformance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `siteperformance` (
  `performanceId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) DEFAULT NULL,
  `siteId` varchar(50) NOT NULL,
  `supervisorId` varchar(50) DEFAULT NULL,
  `caseType` enum('Good','Bad') NOT NULL,
  `details` text NOT NULL,
  `rating` int DEFAULT '5',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`performanceId`),
  KEY `fk_perf_company` (`companyId`),
  KEY `fk_perf_site` (`siteId`),
  KEY `fk_perf_supervisor` (`supervisorId`,`companyId`),
  CONSTRAINT `fk_perf_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_perf_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE,
  CONSTRAINT `fk_perf_supervisor` FOREIGN KEY (`supervisorId`, `companyId`) REFERENCES `users` (`userId`, `companyId`) ON DELETE SET NULL,
  CONSTRAINT `siteperformance_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sitephotos`
--

DROP TABLE IF EXISTS `sitephotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sitephotos` (
  `photoId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) NOT NULL,
  `siteId` varchar(50) NOT NULL,
  `photoUrl` varchar(500) NOT NULL,
  `caption` varchar(225) DEFAULT NULL,
  `uploadedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`photoId`),
  KEY `fk_sitephotos_company` (`companyId`),
  KEY `fk_sitephotos_site` (`siteId`),
  CONSTRAINT `fk_sitephotos_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_sitephotos_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sites`
--

DROP TABLE IF EXISTS `sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sites` (
  `siteId` varchar(50) NOT NULL,
  `companyId` varchar(50) NOT NULL,
  `siteName` varchar(255) NOT NULL,
  `status` enum('ongoing','completed','halted','upcoming') DEFAULT NULL,
  `risk` enum('On Track','Minor Delay','At Risk','Completed') DEFAULT 'On Track',
  `completion` int DEFAULT '0',
  `budget` decimal(15,2) DEFAULT '0.00',
  `startDate` date DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `workersCount` int DEFAULT '0',
  `siteEngineerId` varchar(50) DEFAULT NULL,
  `clientName` varchar(50) DEFAULT NULL,
  `clientPhoneNumber` varchar(20) DEFAULT NULL,
  `siteLocation` varchar(300) DEFAULT NULL,
  `completedDate` date DEFAULT NULL,
  `feedback` varchar(500) DEFAULT NULL,
  `haltReason` varchar(500) DEFAULT NULL,
  `haltDate` date DEFAULT NULL,
  PRIMARY KEY (`siteId`),
  KEY `fk_projects_company` (`companyId`),
  KEY `fk_projects_engineer` (`siteEngineerId`),
  CONSTRAINT `fk_projects_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_projects_engineer` FOREIGN KEY (`siteEngineerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sitetransactions`
--

DROP TABLE IF EXISTS `sitetransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sitetransactions` (
  `transactionId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) DEFAULT NULL,
  `siteId` varchar(50) DEFAULT NULL,
  `transactionDate` date DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('Credit','Debit') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `modeOfPayment` enum('UPI','Cash','NetBanking','Cheque') DEFAULT NULL,
  PRIMARY KEY (`transactionId`),
  KEY `fk_transactions_company` (`companyId`),
  KEY `fk_transactions_site` (`siteId`),
  CONSTRAINT `fk_transactions_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_transactions_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stockrequests`
--

DROP TABLE IF EXISTS `stockrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stockrequests` (
  `requestId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) DEFAULT NULL,
  `siteId` varchar(50) DEFAULT NULL,
  `item` varchar(255) DEFAULT NULL,
  `quantity` varchar(100) DEFAULT NULL,
  `requestDate` date DEFAULT NULL,
  `status` enum('Pending','Completed','Rejected','Approved') DEFAULT NULL,
  `deadline` varchar(20) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`requestId`),
  KEY `fk_stock_company` (`companyId`),
  KEY `fk_stock_site` (`siteId`),
  CONSTRAINT `fk_stock_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_stock_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `taskId` int NOT NULL AUTO_INCREMENT,
  `companyId` varchar(50) DEFAULT NULL,
  `siteId` varchar(50) DEFAULT NULL,
  `description` text NOT NULL,
  `assignedTo` varchar(255) DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `status` enum('Pending','In Progress','Completed') DEFAULT 'Pending',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`taskId`),
  KEY `fk_tasks_company` (`companyId`),
  KEY `fk_tasks_site` (`siteId`),
  CONSTRAINT `fk_tasks_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_site` FOREIGN KEY (`siteId`) REFERENCES `sites` (`siteId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userId` varchar(50) NOT NULL,
  `companyId` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('md','supervisor','client','procurementManager') DEFAULT NULL,
  `phoneNumber` varchar(20) DEFAULT NULL,
  `userEmail` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`userId`,`companyId`),
  UNIQUE KEY `userEmail` (`userEmail`),
  KEY `fk_users_company` (`companyId`),
  CONSTRAINT `fk_users_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`companyId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-18 14:34:26
