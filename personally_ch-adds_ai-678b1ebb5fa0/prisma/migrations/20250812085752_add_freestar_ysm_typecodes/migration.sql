-- CreateTable
CREATE TABLE "FreestarYsmTypecodes" (
    "id" TEXT NOT NULL,
    "c_site" VARCHAR(35) NOT NULL,
    "c_market" VARCHAR(11) NOT NULL,
    "c_network" VARCHAR(25) NOT NULL,
    "c_campaign" VARCHAR(50) NOT NULL,
    "c_adgroup" VARCHAR(50) NOT NULL,
    "c_supplier" VARCHAR(25) NOT NULL,
    "keyword" VARCHAR(100) NOT NULL,
    "feed" VARCHAR(25) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreestarYsmTypecodes_pkey" PRIMARY KEY ("id")
);
