/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `faviconUrl` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `tagline` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `themeColor` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `StaticPage` table. All the data in the column will be lost.
  - You are about to drop the column `pageName` on the `StaticPage` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `StaticPage` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StaticPage` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[site_id,slug]` on the table `Article` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[site_id,page_type]` on the table `StaticPage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `site_id` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `site_name` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `page_type` to the `StaticPage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `site_id` to the `StaticPage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `StaticPage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `StaticPage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StaticPageType" AS ENUM ('HOME', 'ABOUT', 'PRIVACY_POLICY', 'ADVERTISE', 'CONTACT', 'TERMS');

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Site" DROP CONSTRAINT "Site_userId_fkey";

-- DropForeignKey
ALTER TABLE "StaticPage" DROP CONSTRAINT "StaticPage_siteId_fkey";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "createdAt",
DROP COLUMN "imageUrl",
DROP COLUMN "siteId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "meta_description" TEXT,
ADD COLUMN     "meta_keywords" TEXT,
ADD COLUMN     "meta_title" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "site_id" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "address",
DROP COLUMN "company",
DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "faviconUrl",
DROP COLUMN "logoUrl",
DROP COLUMN "phoneNumber",
DROP COLUMN "siteName",
DROP COLUMN "tagline",
DROP COLUMN "themeColor",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "site_name" TEXT NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StaticPage" DROP COLUMN "createdAt",
DROP COLUMN "pageName",
DROP COLUMN "siteId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB,
ADD COLUMN     "page_type" "StaticPageType" NOT NULL,
ADD COLUMN     "site_id" TEXT NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nicename" TEXT,
ADD COLUMN     "roleId" TEXT NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteMeta" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "meta_key" TEXT NOT NULL,
    "meta_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SiteMeta_site_id_meta_key_key" ON "SiteMeta"("site_id", "meta_key");

-- CreateIndex
CREATE UNIQUE INDEX "Article_site_id_slug_key" ON "Article"("site_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "StaticPage_site_id_page_type_key" ON "StaticPage"("site_id", "page_type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMeta" ADD CONSTRAINT "SiteMeta_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaticPage" ADD CONSTRAINT "StaticPage_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
