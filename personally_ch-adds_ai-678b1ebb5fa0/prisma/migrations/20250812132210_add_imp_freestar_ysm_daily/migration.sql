-- CreateTable
CREATE TABLE "ImpFreestarYsmDaily" (
    "date" DATE NOT NULL,
    "site_domain" VARCHAR(255) NOT NULL,
    "traffic_source_name" VARCHAR(255) NOT NULL,
    "traffic_source_code" VARCHAR(50) NOT NULL,
    "product" VARCHAR(255) NOT NULL,
    "market" VARCHAR(255) NOT NULL,
    "source_tag" VARCHAR(255) NOT NULL,
    "type_tag" VARCHAR(255) NOT NULL,
    "device_type" VARCHAR(50) NOT NULL,
    "ad_type" VARCHAR(50) NOT NULL,
    "searches" INTEGER NOT NULL,
    "bidded_searches" INTEGER NOT NULL,
    "bidded_results" INTEGER NOT NULL,
    "bidded_clicks" INTEGER NOT NULL,
    "partner_net_revenue" DECIMAL(18,5) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpFreestarYsmDaily_pkey" PRIMARY KEY ("date","site_domain","traffic_source_code","type_tag","device_type","ad_type")
);
