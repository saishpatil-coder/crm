"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import api from "../../utils/api";
import { DataEncrypt, DataDecrypt } from "../../utils/encryption";
import withAuth from "../../utils/withAuth";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { callAlert } from "../../redux/actions/alert";
import Layout from "@/components/Dashboard/layout";
import BannersTransactions from "@/components/Banners/BannersReport";
import {
  Grid,
  Button,
  Typography,
  Box,
  TextField,
  Card,
  FormControl,
  CardContent,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
} from "@mui/material";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { styled } from "@mui/material/styles";
import {
  Search,
  Refresh,
  Tune,
  Add,
  Leaderboard,
  CheckCircle,
  HighlightOff,
  DeleteForever,
} from "@mui/icons-material";

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: "6px",
  height: "52px",
  display: "flex",
  alignItems: "center",
  transition: "all 0.15s ease",
  flex: "1 1 120px",
  minWidth: "110px",
  border: "1px solid rgba(0,0,0,0.04)",
}));
function BannersReport(props) {
  const [report, setReport] = useState(null);

  // full data fetched from API (never modified)
  const [allData, setAllData] = useState([]);

  // data shown in table after client-side filtering
  const [showServiceTrans, setShowServiceTrans] = useState([]);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedApp, setSelectedApp] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [fromDate, setFromDate] = useState(dayjs().startOf("month"));
  const [toDate, setToDate] = useState(dayjs());

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const [categories, setCategories] = useState([]);
  const [appCategories, setAppCategories] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false); // track UI filters
  const [categoryLoading, setcategoryLoading] = useState(false);
  const [categoryName, setcategoryName] = useState("");

  // Update hasActiveFilters whenever filter states change
  useEffect(() => {
    const activeFilters = Boolean(
      searchTerm ||
      (selectedStatus && selectedStatus !== "all") ||
      (selectedApp && selectedApp !== "all") ||
      (selectedCategory && selectedCategory !== "all") ||
      !fromDate.isSame(dayjs().startOf("month"), "day") ||
      !toDate.isSame(dayjs(), "day"),
    );

    setHasActiveFilters(activeFilters);
  }, [
    searchTerm,
    selectedStatus,
    selectedApp,
    selectedCategory,
    fromDate,
    toDate,
  ]);

  // Fetch categories and apps
  useEffect(() => {
    const getCategories = async () => {
      try {
        setcategoryLoading(true);
        const response = await api.get(
          "/api/banner/66a815be731fee133d7ecc8f240447c14e770b83",
        );
        const decrypted = DataDecrypt(response.data.data);

        if (decrypted.status === 200) {
          setAppCategories(decrypted.data.notificationApp || []);
          setCategories(decrypted.data.bannersCategory || []);
          await fetchAllBanners(
            decrypted.data.notificationApp || [],
            decrypted.data.bannersCategory || [],
          );
        } else {
          console.warn("No categories found:", decrypted.message);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories");
      } finally {
        setcategoryLoading(false);
      }
    };
    getCategories();
  }, []);

  // Fetch all banner data ONCE (or on refresh)
  const fetchAllBanners = useCallback(
    async (passedApp, passedCat) => {
      setLoading(true);
      setError("");
      try {
        // request uses current date range, but backend data will be treated as raw; we're going to filter client-side
        const reqData = {
          from_date: dayjs().startOf("year").format("YYYY-MM-DD"), // ask broad range - backend may ignore but safe
          to_date: dayjs().format("YYYY-MM-DD"),
          searchTerm: "",
          status: "",
          app_id: "",
          category_id: "",
        };

        const encryptedReqData = DataEncrypt(JSON.stringify(reqData));
        const response = await api.post(
          "/api/banner/b0922bbeca57785f0add2136bca4786594e739cd",
          { data: encryptedReqData },
        );

        if (response.data?.data) {
          const decryptedResponse = DataDecrypt(response.data.data);

          if (decryptedResponse.status === 200) {
            // Map app and category names to banners and store in allData
            const normalized = decryptedResponse.data.map((banner) => {
              // Find app name by app_id
              const app = (passedApp ? passedApp : appCategories).find(
                (a) => String(a.id) === String(banner.app_id),
              );
              // Find category name by type_id
              const cat = (passedCat ? passedCat : categories).find(
                (c) => String(c.id) === String(banner.type_id),
              );

              return {
                ...banner,
                app_name: app ? app.app_name : "Unknown",
                category: cat ? cat.category_name : "Unknown",

                created_on: banner.created_on ? dayjs(banner.created_on) : null,
              };
            });

            setAllData(normalized);
            setReport(decryptedResponse.report);
            // apply current filters on the freshly fetched data
            applyFiltersOnData(normalized, {
              searchTerm,
              selectedStatus,
              selectedApp,
              selectedCategory,
              fromDate,
              toDate,
            });
          } else {
            setError(
              decryptedResponse.message || "Failed to fetch banner data",
            );
            setAllData([]);
            setShowServiceTrans([]);
          }
        } else {
          setError("Failed to fetch banner data");
          setAllData([]);
          setShowServiceTrans([]);
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
        const errorMessage =
          err?.response?.data?.error || err.message || "Network error";
        setError(errorMessage);
        dispatch(callAlert({ message: errorMessage, type: "FAILED" }));
        setAllData([]);
        setShowServiceTrans([]);
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  // Auto-fetch once categories/apps are ready
  useEffect(() => {
    // fetch only after categories & appCategories loaded (so mapping works)
    if (
      categories.length > 0 &&
      appCategories.length > 0 &&
      allData.length === 0
    ) {
      // Only fetch if we don't already have data
      fetchAllBanners();
    }
  }, [allData.length, fetchAllBanners]);

  // Apply filters whenever filter states change
  useEffect(() => {
    if (allData.length > 0) {
      console.log("🔄 Auto-applying filters due to state change");
      applyFiltersOnData(allData);
    }
  }, [
    searchTerm,
    selectedStatus,
    selectedApp,
    selectedCategory,
    fromDate,
    toDate,
    allData,
  ]);

  // Helper: convert selectedStatus string to numeric status if needed
  const statusStringToValue = (status) => {
    if (!status) return null;
    if (status === "active") return 1;
    if (status === "inactive") return 2;
    // allow passing numeric string too
    const n = Number(status);
    return Number.isNaN(n) ? null : n;
  };

  // Core client-side filtering function - can be called whenever filters change
  const applyFiltersOnData = (data = allData, opts = {}) => {
    setcategoryLoading(true);
    console.log("🔥 applyFiltersOnData CALLED");

    const {
      searchTerm: sTerm = searchTerm,
      selectedStatus: sStatus = selectedStatus,
      selectedApp: sApp = selectedApp,
      selectedCategory: sCategory = selectedCategory,
      fromDate: fDate = fromDate,
      toDate: tDate = toDate,
    } = opts;

    let filtered = Array.isArray(data) ? [...data] : [];

    // Search - match title, banner_for, app_name, category (case-insensitive)
    if (sTerm && sTerm.trim() !== "") {
      const q = sTerm.trim().toLowerCase();
      console.log(`🔥 DEBUG - Searching for: "${q}"`);

      filtered = filtered.filter((item) => {
        const title = (item.title || "").toString().toLowerCase();
        const bannerFor = (item.banner_for || "").toString().toLowerCase();
        const appName = (item.app_name || "").toString().toLowerCase();
        const categoryName = (item.category || "").toString().toLowerCase();
        const idStr = (item.id || "").toString().toLowerCase();

        const matches =
          title.includes(q) ||
          bannerFor.includes(q) ||
          appName.includes(q) ||
          categoryName.includes(q) ||
          idStr.includes(q);

        return matches;
      });
    }

    // Status filter
    if (sStatus !== "all") {
      const statusVal = statusStringToValue(sStatus);
      if (statusVal !== null) {
        console.log(
          `🔥 DEBUG - Filtering by status: ${sStatus} (value: ${statusVal})`,
        );
        filtered = filtered.filter((item) => Number(item.status) === statusVal);
      }
    }

    // App filter (app id)
    if (sApp !== "all") {
      console.log(`🔥 DEBUG - Filtering by app ID: ${sApp}`);
      filtered = filtered.filter(
        (item) => String(item.app_id) === String(sApp),
      );
    }

    // Category filter (type_id or category id)
    if (sCategory !== "all") {
      console.log(`🔥 DEBUG - Filtering by category ID: ${sCategory}`);
      filtered = filtered.filter(
        (item) => String(item.type_id) === String(sCategory),
      );
    }

    // Date range filter on created_on (inclusive) - FIXED VERSION
    if (fDate && tDate) {
      const start = dayjs(fDate).startOf("day");
      const end = dayjs(tDate).endOf("day");

      console.log(
        `🔥 DEBUG - Date range filter: ${start.format("YYYY-MM-DD")} to ${end.format("YYYY-MM-DD")}`,
      );

      filtered = filtered.filter((item) => {
        // Ensure created_on is a valid dayjs object
        let created;
        if (dayjs.isDayjs(item.created_on)) {
          created = item.created_on;
        } else if (item.created_on) {
          created = dayjs(item.created_on);
        } else {
          return false; // Skip items without date
        }

        // Check if it's a valid dayjs object
        if (!created || !created.isValid()) {
          console.warn("Invalid date for item:", item.id, item.created_on);
          return false;
        }

        // Use string comparison for safety
        const createdDate = created.format("YYYY-MM-DD");
        const startDate = start.format("YYYY-MM-DD");
        const endDate = end.format("YYYY-MM-DD");

        // Simple string comparison
        const isInRange = createdDate >= startDate && createdDate <= endDate;

        return isInRange;
      });
    }

    console.log(
      `🔥 DEBUG - Filtering complete. Results: ${filtered.length} items`,
    );
    setcategoryLoading(false);
    setShowServiceTrans(filtered);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedApp("all");
    setSelectedCategory("all");
    setFromDate(dayjs().startOf("month"));
    setToDate(dayjs());

    applyFiltersOnData(allData, {
      searchTerm: "",
      selectedStatus: "all",
      selectedApp: "all",
      selectedCategory: "all",
      fromDate: dayjs().startOf("month"),
      toDate: dayjs(),
    });
  };

  // Refresh data (re-fetch from API)
  const handleRefresh = () => {
    fetchAllBanners();
  };

  // Stats configuration with hover effect (values will be derived from report or computed)
  const statsCards = [
    {
      label: "Total Banners",
      value: report?.total_count ?? allData.length ?? 0,
      color: "#FF6B35",
      icon: "📊",
      bgColor: "#FFF2ED",
    },
    {
      label: "Active",
      value:
        report?.total_active ??
        allData.filter((r) => Number(r.status) === 1).length ??
        0,
      color: "#00C853",
      icon: "✅",
      bgColor: "#F0FFF4",
    },
    {
      label: "Inactive",
      value:
        report?.total_inactive ??
        allData.filter((r) => Number(r.status) === 2).length ??
        0,
      color: "#5C6BC0",
      icon: "❌",
      bgColor: "#F0F2FF",
    },
    {
      label: "Deleted",
      value:
        report?.total_deleted ??
        allData.filter((r) => Number(r.status) === 0).length ??
        0,
      color: "#EC407A",
      icon: "🗑️",
      bgColor: "#FFF0F5",
    },
  ];

  // Chip delete handlers - change filter locally and reapply
  const removeSearchChip = () => {
    setSearchTerm("");
    applyFiltersOnData(allData, {
      searchTerm: "",
      selectedStatus,
      selectedApp,
      selectedCategory,
      fromDate,
      toDate,
    });
  };

  const removeStatusChip = () => {
    setSelectedStatus("all");
    applyFiltersOnData(allData, {
      searchTerm,
      selectedStatus: "all",
      selectedApp,
      selectedCategory,
      fromDate,
      toDate,
    });
  };

  const removeAppChip = () => {
    setSelectedApp("all");
    applyFiltersOnData(allData, {
      searchTerm,
      selectedStatus,
      selectedApp: "all",
      selectedCategory,
      fromDate,
      toDate,
    });
  };

  const removeCategoryChip = () => {
    setSelectedCategory("all");
    applyFiltersOnData(allData, {
      searchTerm,
      selectedStatus,
      selectedApp,
      selectedCategory: "all",
      fromDate,
      toDate,
    });
  };

  const removeFromDateChip = () => {
    setFromDate(dayjs().startOf("month"));
    applyFiltersOnData(allData, {
      searchTerm,
      selectedStatus,
      selectedApp,
      selectedCategory,
      fromDate: dayjs().startOf("month"),
      toDate,
    });
  };
  const removeToDateChip = () => {
    setToDate(dayjs());
    applyFiltersOnData(allData, {
      searchTerm,
      selectedStatus,
      selectedApp,
      selectedCategory,
      fromDate,
      toDate: dayjs(),
    });
  };

  return (
    <Layout>
      {categoryLoading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(2px)",
            zIndex: 1300,
          }}
        >
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <img src="/loader.gif" alt="Loading..." width={80} height={80} />
            <Typography mt={1} sx={{ fontSize: "0.9rem" }}>
              Loading...
            </Typography>
          </Paper>
        </Box>
      )}
      <Box sx={{ p: 2 }}>
        {/* Header Section */}
        {/* Add New Button
        <Button
          variant="contained"
          href={`/add-new-product/`}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 16,
            px: 3,
            py: 1,
            background: "#2198f3",
            boxShadow: "0 2px 8px 0 rgba(33, 203, 243, 0.15)",
            textTransform: "none",
            whiteSpace: "nowrap",
            "&:hover": {
              background: "#2198f3",
              opacity: 0.9,
            },
          }}
        >
          Add New
        </Button> */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Banners Report
          </Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                bgcolor: showFilters ? "primary.main" : "grey.100",
                color: showFilters ? "white" : "grey.700",
                "&:hover": {
                  bgcolor: showFilters ? "primary.dark" : "grey.200",
                },
              }}
            >
              <Tune fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                bgcolor: "grey.100",
                color: "grey.700",
                "&:hover": { bgcolor: "grey.200" },
                "&:disabled": { opacity: 0.5 },
              }}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <Refresh fontSize="small" />
              )}
            </IconButton>

            <Button
              variant="contained"
              href="/add-new-banner/"
              startIcon={<Add />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                px: 2,
                py: 1,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                },
              }}
            >
              Add Banner
            </Button>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={0.5} sx={{ mb: 1, height: "100px" }}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                flexWrap: "wrap",
              }}
            >
              {statsCards.map((card, index) => (
                <Tooltip title={`${card.label}: ${card.value}`} key={index}>
                  <StatCard
                    sx={{
                      backgroundColor: card.bgColor,
                      borderLeft: `3px solid ${card.color}`,
                      height: "70px",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      "&:hover": {
                        backgroundColor: card.color,
                        boxShadow: `0 4px 12px ${card.color}60`,
                        transform: "translateY(-1px)",
                        "& .MuiTypography-root": {
                          color: "white",
                        },
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        padding: "4px 18px !important",
                        width: "100%",
                        textAlign: "center",
                        "&:last-child": { pb: "4px" },
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#000000",
                          transition: "color 0.2s ease",
                          fontWeight: 700,
                          fontSize: "14px",
                          mb: 0.1,
                          lineHeight: 1.2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.5,
                        }}
                      >
                        <span style={{ fontSize: "12px" }}>{card.icon}</span>
                        {card.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#666666",
                          transition: "color 0.2s ease",
                          fontWeight: 500,
                          fontSize: "10px",
                          lineHeight: 1.2,
                        }}
                      >
                        {card.label}
                      </Typography>
                    </CardContent>
                  </StatCard>
                </Tooltip>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters Section */}
        {showFilters && (
          <Card sx={{ p: 3, mb: 3, bgcolor: "grey.50", borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <>
                <FilterAltIcon
                  sx={{ fontSize: 18, color: "#667eea", mr: 0.1 }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: "#667eea",
                    fontSize: "15px",
                  }}
                >
                  Filter Banners
                </Typography>
              </>
              {/* Search Field */}
              <TextField
                placeholder="Search banners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: "grey.500", mr: 1 }} />,
                }}
                sx={{
                  minWidth: "350px",
                  "& .MuiOutlinedInput-root": {
                    height: 40,
                  },
                }}
                size="small"
              />

              {/* Status Filter */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* App Filter */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>App</InputLabel>
                <Select
                  value={selectedApp}
                  label="App"
                  onChange={(e) => setSelectedApp(e.target.value)}
                >
                  <MenuItem value="all">All Apps</MenuItem>
                  {appCategories.map((app) => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.app_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Category Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.category_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Range */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <DatePicker
                    value={fromDate}
                    onChange={(d) => setFromDate(d || dayjs().startOf("month"))}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        label: "From Date",
                        sx: { width: 140 },
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: "grey.600", mx: 1 }}>
                    to
                  </Typography>
                  <DatePicker
                    value={toDate}
                    onChange={(d) => setToDate(d || dayjs())}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        label: "To Date",
                        sx: { width: 140 },
                      },
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedStatus("all");
                    setSelectedApp("all");
                    setFromDate(dayjs().startOf("month"));
                    setToDate(dayjs());
                    setHasActiveFilters(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                    },
                  }}
                >
                  Reset
                </Button>
              </LocalizationProvider>
            </Box>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {searchTerm && (
                  <Chip
                    label={`Search: ${searchTerm}`}
                    size="small"
                    onDelete={removeSearchChip}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {selectedStatus && selectedStatus !== "all" && (
                  <Chip
                    label={`Status: ${
                      selectedStatus === "active"
                        ? "Active"
                        : selectedStatus === "inactive"
                          ? "Inactive"
                          : selectedStatus
                    }`}
                    onDelete={removeStatusChip}
                    variant="outlined"
                    size="small"
                    sx={{
                      color: "#9C27B0",
                      borderColor: "#9C27B0",
                      "& .MuiChip-deleteIcon": {
                        color: "#9C27B0",
                      },
                    }}
                  />
                )}

                {selectedApp && selectedApp !== "all" && (
                  <Chip
                    label={`App: ${
                      appCategories.find(
                        (app) => String(app.id) === String(selectedApp),
                      )?.app_name || selectedApp
                    }`}
                    onDelete={removeAppChip}
                    variant="outlined"
                    size="small"
                    sx={{
                      color: "#1E88E5",
                      borderColor: "#1E88E5",
                      "& .MuiChip-deleteIcon": {
                        color: "#1E88E5",
                      },
                    }}
                  />
                )}
                {selectedCategory && selectedCategory !== "all" && (
                  <Chip
                    label={`Category: ${(() => {
                      const matchedCategory = categories.find(
                        (cat) => String(cat.id) === String(selectedCategory),
                      );
                      return matchedCategory
                        ? matchedCategory.category_name
                        : selectedCategory;
                    })()}`}
                    onDelete={removeCategoryChip}
                    variant="outlined"
                    size="small"
                    sx={{
                      color: "#43A047",
                      borderColor: "#43A047",
                      "& .MuiChip-deleteIcon": {
                        color: "#43A047",
                      },
                    }}
                  />
                )}

                {!fromDate.isSame(dayjs().startOf("month"), "day") && (
                  <Chip
                    label={`From: ${fromDate.format("DD/MM/YY")}`}
                    size="small"
                    onDelete={removeFromDateChip}
                    color="warning"
                    variant="outlined"
                  />
                )}
                {!toDate.isSame(dayjs(), "day") && (
                  <Chip
                    label={`To: ${toDate.format("DD/MM/YY")}`}
                    size="small"
                    onDelete={removeToDateChip}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Card>
        )}

        {/* Results Summary */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            p: 2,
            backgroundColor: "grey.50",
            borderRadius: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "grey.600", fontWeight: 600 }}
          >
            {`Showing ${showServiceTrans.length} banners${hasActiveFilters ? " (filtered)" : ""}${loading ? " (Loading...)" : ""}`}
          </Typography>
        </Box>
        <Box
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            backgroundColor: "white",
          }}
        >
          <BannersTransactions
            loading={categoryLoading}
            showServiceTrans={showServiceTrans}
          />
        </Box>
      </Box>
    </Layout>
  );
}

export default withAuth(BannersReport);
