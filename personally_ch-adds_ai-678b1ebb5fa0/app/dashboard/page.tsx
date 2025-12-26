"use client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Users, Hourglass, Package, HandCoins } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardData {
  chartData: Array<{
    date: string;
    bidded_clicks: number;
    revenue: number;
  }>;
  summaryTotals: {
    total_clicks: number;
    total_revenue: number;
  };
  isSingleDay: boolean;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    website: '',
    date_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    format: undefined as string | undefined,
    totals: '1'
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        website: formData.website,
        date_from: formData.date_from,
        date_to: formData.date_to,
        totals: formData.totals
      });

      const response = await fetch(`/api/freestar/dashboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleExport = async (format: string) => {
    const params = new URLSearchParams({
      website: formData.website,
      date_from: formData.date_from,
      date_to: formData.date_to,
      format: format
    });

    const response = await fetch(`/api/freestar/dashboard?${params}`);
    if (response.ok) {
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    }
  };

  // useEffect(() => {
  //   fetchDashboardData();
  // }, [formData]);

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
      fetchSites("");
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, []);

  // Calculate summary data
  const summary = [
    {
      label: "Net Revenue",
      value: dashboardData ? `$${dashboardData.summaryTotals.total_revenue.toFixed(2)}` : "$0",
      icon: <BarChart2 className="w-6 h-6 text-cyan-600" />,
      growth: dashboardData ? `+${((dashboardData.summaryTotals.total_revenue / 100) * 100).toFixed(1)}%` : "+0%",
      growthType: "up",
    },
    {
      label: "Total Clicks",
      value: dashboardData ? dashboardData.summaryTotals.total_clicks.toString() : "0",
      icon: <Users className="w-6 h-6 text-orange-500" />,
      growth: dashboardData ? `+${((dashboardData.summaryTotals.total_clicks / 100) * 100).toFixed(1)}%` : "+0%",
      growthType: "up",
    },
    {
      label: "Pending Payouts",
      value: "$0",
      icon: <Hourglass className="w-6 h-6 text-yellow-500" />,
      growth: "+0%",
      growthType: "up",
    },
    {
      label: "Products",
      value: "0",
      icon: <Package className="w-6 h-6 text-purple-600" />,
      growth: "+0%",
      growthType: "up",
    },
    {
      label: "Agent Shares",
      value: dashboardData ? `$${(dashboardData.summaryTotals.total_revenue * 0.2).toFixed(2)}` : "$0",
      icon: <HandCoins className="w-6 h-6 text-green-600" />,
      growth: "No change",
      growthType: "up",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-col-reverse justify-between lg:flex-row lg:items-center">
        <h2 className="text-2xl font-bold">Publisher Dashboard</h2>
        <Tabs defaultValue="1y" className="w-full lg:w-auto">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger value="today" className="w-[80px]">
              Today
            </TabsTrigger>
            <TabsTrigger value="7d" className="w-[80px]">
              7 Days
            </TabsTrigger>
            <TabsTrigger value="30d" className="w-[80px]">
              30 Days
            </TabsTrigger>
            <TabsTrigger value="1y" className="w-[80px]">
              1 Year
            </TabsTrigger>
            <TabsTrigger value="custom" className="w-[80px]">
              Custom
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {summary.map((item) => (
          <Card key={item.label} className="flex flex-col gap-2 p-4 bg-white">
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="font-medium text-gray-500 text-sm">
                {item.label}
              </span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-bold">{item.value}</span>
              <span
                className={`text-xs font-semibold ml-2 flex items-center ${
                  item.growthType === "up"
                    ? "text-emerald-600"
                    : item.growthType === "down"
                    ? "text-red-700"
                    : "text-gray-400"
                }`}
              >
                {item.growthType === "up" && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                )}
                {item.growthType === "down" && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                )}
                {item.growth}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Form Controls */}
      <Card className="bg-white p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <Label htmlFor="website">Website:</Label>
            <Select value={formData.website} onValueChange={(value) => setFormData({ ...formData, website: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select website" />
              </SelectTrigger>
              <SelectContent className="w-full bg-white">
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id} className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100">{site.domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date_from">Date from:</Label>
            <Input
              id="date_from"
              type="date"
              value={formData.date_from}
              onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="date_to">Date to:</Label>
            <Input
              id="date_to"
              type="date"
              value={formData.date_to}
              onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="format">Format:</Label>
            <Select value={formData.format || ""} onValueChange={(value) => setFormData({ ...formData, format: value || undefined })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="w-full bg-white">
                <SelectItem value="graph" className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100">Graph</SelectItem>
                <SelectItem value="csv" className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100">CSV</SelectItem>
                <SelectItem value="json" className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100">JSON</SelectItem>
                <SelectItem value="xml" className="cursor-pointer hover:bg-gray-100 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white focus:bg-gray-100">XML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
            {formData.format && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => handleExport(formData.format!)}
              >
                Export {formData.format.toUpperCase()}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Clicks and Revenue Analysis Chart */}
      <Card className="bg-white p-0 gap-0">
        <h3 className="text-lg font-semibold border-b m-0 px-6 py-4">
          Clicks and Revenue Analysis
        </h3>
        <div className="p-6">
          {dashboardData && dashboardData.chartData.length > 0 ? (
            <div className="w-full h-72">
              <Chart data={dashboardData.chartData} isSingleDay={dashboardData.isSingleDay} />
            </div>
          ) : (
            <div className="w-full h-72 flex items-center justify-center">
              <span className="text-gray-400">
                {loading ? "Loading chart data..." : "No chart data available"}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Totals */}
      {dashboardData && (
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Summary Totals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {dashboardData.summaryTotals.total_clicks.toLocaleString()}
              </div>
              <div className="text-gray-600">Total Clicks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${dashboardData.summaryTotals.total_revenue.toFixed(2)}
              </div>
              <div className="text-gray-600">Total Revenue</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Simple Chart Component
function Chart({ data, isSingleDay }: { data: any[], isSingleDay: boolean }) {
  const labels = data.map(row => isSingleDay ? row.date.split(' ')[1] : row.date);
  const clicksData = data.map(row => row.bidded_clicks);
  const revenueData = data.map(row => row.revenue);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-semibold mb-4">
          {isSingleDay ? 'Hourly Data' : 'Daily Data'}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Clicks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Revenue</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {data.length} data points loaded
          </div>
        </div>
      </div>
    </div>
  );
}
