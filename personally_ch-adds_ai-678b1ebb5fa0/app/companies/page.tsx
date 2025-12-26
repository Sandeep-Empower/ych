"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import {
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  User,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import EditCompanyModal from "@/app/components/EditCompanyModal";
import DeleteConfirmationModal from "@/app/components/DeleteConfirmationModal";
import { useAuth } from "../context/AuthContext";

interface Company {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  vat: string;
  status: boolean;
  created_at: string;
  user: {
    id: string;
    email: string;
    nicename: string | null;
  };
  sites: Array<{
    id: string;
    domain: string;
    site_name: string;
    status: boolean;
  }>;
  _count: {
    sites: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const fetchCompanies = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/companies/get?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || "Failed to fetch companies");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== "") {
        fetchCompanies(1, search);
      } else {
        fetchCompanies(1, "");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handlePageChange = (newPage: number) => {
    fetchCompanies(newPage, search);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Action handlers
  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setEditModalOpen(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleToggleStatus = async (company: Company) => {
    // Check if company has sites before making the request
    if (company._count.sites > 0) {
      alert(
        `Cannot toggle status for company "${company.name}" - ${company._count.sites} site(s) are registered. Please delete all sites first.`
      );
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/companies/toggle-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: company.id,
          status: !company.status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the company in the list
        setCompanies((prev) =>
          prev.map((c) => (c.id === company.id ? data.data : c))
        );
      } else {
        alert(data.error || "Failed to update company status");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    // Check if company has sites before making the request
    if (companyToDelete._count.sites > 0) {
      alert(
        `Cannot delete company "${companyToDelete.name}" - ${companyToDelete._count.sites} site(s) are registered. Please delete all sites first.`
      );
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/companies/delete?id=${companyToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        // Remove the company from the list
        setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
        setDeleteModalOpen(false);
        setCompanyToDelete(null);

        // Refresh the list to update pagination
        fetchCompanies(pagination.page, search);
      } else {
        alert(data.error || "Failed to delete company");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === updatedCompany.id ? updatedCompany : c))
    );
  };

  if (error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-700 mb-4">Error</h1>
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => fetchCompanies()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative max-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 bg-white" />
          <Input
            type="text"
            placeholder="Search companies"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white">
          <CardContent>
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold">{pagination.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent>
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Sites</p>
                <p className="text-2xl font-bold">
                  {companies.reduce(
                    (total, company) => total + company._count.sites,
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent>
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Companies</p>
                <p className="text-2xl font-bold">
                  {companies.filter((company) => company.status).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size="md" text="Loading companies..." />
        </div>
      ) : companies.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No companies found
            </h3>
            <p className="text-gray-600">
              {search
                ? "Try adjusting your search terms."
                : "No companies have been registered yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="bg-white">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {company.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className="text-white"
                        variant={company.status ? "default" : "secondary"}
                      >
                        {company.status ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {company._count.sites}{" "}
                        {company._count.sites === 1 ? "Site" : "Sites"}
                      </Badge>
                      {company._count.sites > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Protected
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(company)}
                      disabled={actionLoading || (company.user.id !== user?.id && user?.role.name !== 'admin')}
                      title="Edit Company"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(company)}
                      disabled={actionLoading || company._count.sites > 0 || (company.user.id !== user?.id && user?.role.name !== 'admin')}
                      title={
                        company._count.sites > 0
                          ? `Cannot toggle status - ${company._count.sites} site(s) registered`
                          : company.status
                          ? "Disable Company"
                          : company.user.id !== user?.id && user?.role.name !== 'admin'
                            ? "You are not authorized to disable this company"
                            : "Enable Company"
                      }
                      className={
                        company._count.sites > 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    >
                      {company.status ? (
                        <PowerOff className="h-3 w-3 text-orange-600" />
                      ) : (
                        <Power className="h-3 w-3 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(company)}
                      disabled={actionLoading || company._count.sites > 0 || (company.user.id !== user?.id && user?.role.name !== 'admin')}
                      title={
                        company._count.sites > 0
                          ? `Cannot delete - ${company._count.sites} site(s) registered`
                          : company.user.id !== user?.id && user?.role.name !== 'admin'
                            ? "You are not authorized to delete this company"
                            : "Delete Company"
                      }
                      className={`text-red-700 hover:text-red-700 ${
                        company._count.sites > 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{company.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{company.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{company.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {company.user.nicename || company.user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Created {formatDate(company.created_at)}
                    </span>
                  </div>

                  {/* Sites */}
                  {company.sites.length > 0 && (
                    <div className="mt-4 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Sites:
                      </h4>
                      <div>
                        {company.sites.map((site) => (
                          <div
                            key={site.id}
                            className="flex items-center gap-2 text-sm  justify-between border-b last:border-0 py-2"
                          >
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">
                                {site.domain}
                              </span>
                            </div>
                            <Badge
                              variant={site.status ? "default" : "secondary"}
                              className="text-xs text-white"
                            >
                              {site.status ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === pagination.page ? "default" : "outline"
                    }
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10 h-10"
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <EditCompanyModal
        company={selectedCompany}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCompany(null);
        }}
        onUpdate={handleUpdateCompany}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCompanyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Are you sure?"
        message={`You are about to delete this company: <strong>${companyToDelete?.name}</strong><br>This action is irreversible. Please confirm your action.`}
        loading={actionLoading}
      />
    </div>
  );
}
