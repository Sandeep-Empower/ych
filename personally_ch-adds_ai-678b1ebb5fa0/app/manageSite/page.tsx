"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";

type SiteMeta = {
  meta_key: string;
  meta_value: string;
};

type Site = {
  id: string;
  domain: string;
  site_name: string;
  status: boolean;
  site_meta: SiteMeta[];
  company: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
};

async function deleteSite(site_id: string) {
  const res = await fetch(`/api/site/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_id }),
  });
  if (!res.ok) throw new Error("Failed to delete site");
}

export default function Page() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [search, setSearch] = useState("");
  const handleDelete = (site_id: string) => {
    setSiteToDelete(site_id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (siteToDelete) {
      // Call your delete API here
      await deleteSite(siteToDelete);
      setDeleteModalOpen(false);
      setSiteToDelete(null);
      // After deleting, remove the deleted site from the local state
      setSites((prevSites) =>
        prevSites.filter((site) => site.id !== siteToDelete)
      );
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSiteToDelete(null);
  };

  const handleEdit = (siteID: string) => {
    // Implement edit logic or navigation
    router.push(`/edit/step-1?${new URLSearchParams({ siteId: siteID })}`);
  };

  useEffect(() => {
    const controller = new AbortController();
    const debounce = setTimeout(() => {
      const fetchSites = async (search: string) => {
        try {
          setLoading(true);
          const res = await fetch(`/api/site/get-all?search=${search}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error("Failed to fetch sites");
          const data = await res.json();
          setSites(data);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            setError(err.message || "Unknown error");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchSites(search);
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [search]);

  const handleClick = () => {
    setNavigating(true);
    router.push("/create");

    // Reset navigating state after a timeout in case navigation fails
    setTimeout(() => {
      setNavigating(false);
    }, 5000);
  };

  // Group sites by company
  const groupedSites = sites.reduce((groups, site) => {
    const companyId = site.company.id;
    if (!groups[companyId]) {
      groups[companyId] = {
        company: site.company,
        sites: [],
      };
    }
    groups[companyId].sites.push(site);
    return groups;
  }, {} as Record<string, { company: Site["company"]; sites: Site[] }>);

  const companyGroups = Object.values(groupedSites);

  return (
    <div>
      {navigating && <Loader fullScreen text="Loading create page..." />}
      <div className="flex justify-between mb-6 w-full">
        <Input
          className="bg-white mr-6 max-w-[300px]"
          type="search"
          placeholder="Search Site"
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          className="text-white"
          onClick={handleClick}
          disabled={navigating}
        >
          <Plus className="!w-5 !h-5" />
          Create New Site
        </Button>
      </div>
      <Card className="bg-white p-0 gap-0 w-full">
        <h3 className="text-lg font-semibold border-b m-0 px-6 py-4">
          Site Inventory
        </h3>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-700">{error}</div>
          ) : companyGroups.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Site not available, please create a site to view
            </div>
          ) : (
            <div className="divide-y">
              {companyGroups.map((group) => (
                <div key={group.company.id} className="p-6">
                  {/* Company Header */}
                  <div className="mb-4 pb-3 ">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {group.company.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{group.company.email}</span>
                      <span>•</span>
                      <span>{group.company.phone}</span>
                      <span>•</span>
                      <span className="text-cyan-600 font-medium">
                        {group.sites.length}{" "}
                        {group.sites.length === 1 ? "Site" : "Sites"}
                      </span>
                    </div>
                  </div>

                  {/* Sites Table */}
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b-2 bg-gray-50">
                        <th className="py-3 px-4 font-medium  w-[450px]">
                          Site Name
                        </th>
                        <th className="py-3 px-4 font-medium w-[200px]">
                          Domain
                        </th>
                        <th className="py-3 px-4 font-medium w-[200px]">
                          Status
                        </th>
                        <th className="py-3 px-4 font-medium text-center w-[100px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.sites.map((site) => (
                        <tr key={site.id} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">
                            {site.site_name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <a
                              href={`https://${site.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-700 hover:underline"
                            >
                              {site.domain}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                site.status
                                  ? "bg-green-50 text-green-600"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {site.status ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(site.id)}
                                title="Edit Site"
                              >
                                <Pencil className="w-4 h-4 text-cyan-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(site.id)}
                                title="Delete Site"
                              >
                                <Trash className="w-4 h-4 text-red-700" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-xl shadow-2xl p-8 max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base mb-8">
              <span className="block mb-2">
                You are about to delete this site:{" "}
                <b>{sites.find((site) => site.id === siteToDelete)?.domain}</b>
              </span>
              <span className="block">
                This action is irreversible. Please confirm your action.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border border-gray-300 text-gray-800 font-medium rounded-md px-6 py-2"
              onClick={cancelDelete}
              title="Cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md px-6 py-2"
              onClick={confirmDelete}
              title="Delete"
            >
              Yes, delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
