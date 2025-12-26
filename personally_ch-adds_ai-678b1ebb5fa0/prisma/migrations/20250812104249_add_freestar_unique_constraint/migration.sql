/*
  Warnings:

  - A unique constraint covering the columns `[c_site,c_market,c_network,c_campaign,c_adgroup,c_supplier,keyword,feed]` on the table `FreestarYsmTypecodes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FreestarYsmTypecodes_c_site_c_market_c_network_c_campaign_c_key" ON "FreestarYsmTypecodes"("c_site", "c_market", "c_network", "c_campaign", "c_adgroup", "c_supplier", "keyword", "feed");
