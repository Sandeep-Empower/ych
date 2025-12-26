-- CreateTable
CREATE TABLE "UserMeta" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meta_key" TEXT NOT NULL,
    "meta_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMeta_user_id_meta_key_key" ON "UserMeta"("user_id", "meta_key");

-- AddForeignKey
ALTER TABLE "UserMeta" ADD CONSTRAINT "UserMeta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
