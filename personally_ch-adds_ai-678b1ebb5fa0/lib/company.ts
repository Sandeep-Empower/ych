"use server";
import { prisma } from "@/lib/prisma";

/**
 * Fetch all unique companies from user_meta table where meta_key is 'company'.
 * Returns array of { id, name }.
 */
export async function get_all_companies() {
  // get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      metas: true
    }
  });

  let companies = Array();

  users.forEach((user) => {
    const company = user.metas.find((meta) => meta.meta_key == 'company')?.meta_value;
    const phone = user.metas.find((meta) => meta.meta_key == 'phone')?.meta_value;
    const address = user.metas.find((meta) => meta.meta_key == 'address')?.meta_value;
    const email = user.email;
    const id = user.id
    if(company)
      companies.push({company, phone, address, email, id});
  });

  return companies;
}
