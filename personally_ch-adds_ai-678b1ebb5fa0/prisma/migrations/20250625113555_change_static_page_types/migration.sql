/*
  Warnings:

  - The values [PRIVACY_POLICY] on the enum `StaticPageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StaticPageType_new" AS ENUM ('HOME', 'ABOUT', 'PRIVACY', 'ADVERTISE', 'CONTACT', 'TERMS');
ALTER TABLE "StaticPage" ALTER COLUMN "page_type" TYPE "StaticPageType_new" USING ("page_type"::text::"StaticPageType_new");
ALTER TYPE "StaticPageType" RENAME TO "StaticPageType_old";
ALTER TYPE "StaticPageType_new" RENAME TO "StaticPageType";
DROP TYPE "StaticPageType_old";
COMMIT;
