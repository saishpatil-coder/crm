"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import api from "../../utils/api";
import { DataEncrypt, DataDecrypt } from "../../utils/encryption";
import withAuth from "../../utils/withAuth";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { callAlert } from "../../redux/actions/alert";
import Layout from "@/components/Dashboard/layout";
import OperatorsTransactions from "../components/OperatorManagement/OperatorsReport";
import {
  Button,
  Typography,
  Box,
  TextField,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Search, Refresh, Tune, Add } from "@mui/icons-material";
import StatCardComponent from "../components/StatCardComponent/statsCardcomponent";

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function OperatorsReport() {
  const [allData, setAllData] = useState([]);
  const [showServiceTrans, setShowServiceTrans] = useState([]);
  const [categories, setCategories] = useState([]);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fromDate, setFromDate] = useState(dayjs().startOf("month"));
  const [toDate, setToDate] = useState(dayjs());

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Update hasActiveFilters whenever filter states change
  useEffect(() => {
    const activeFilters = Boolean(
      searchTerm ||
      (selectedStatus && selectedStatus !== "all") ||
      (selectedCategory && selectedCategory !== "all") ||
      !fromDate.isSame(dayjs().startOf("month"), "day") ||
      !toDate.isSame(dayjs(), "day"),
    );
    setHasActiveFilters(activeFilters);
  }, [searchTerm, selectedStatus, selectedCategory, fromDate, toDate]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    console.log("Fetching categories...");
    try {
      setCategoryLoading(true);
      const response = await api.get("/api/operator/get-operator-categories");
      console.log("Categories API response:", response.data);

      if (response.data?.status === 200) {
        const sortedCategories = (response.data.data || []).sort();
        console.log("Fetched categories:", sortedCategories);
        setCategories(sortedCategories);

        // Set the first category as default if available
        if (sortedCategories.length > 0 && selectedCategory === "all") {
          console.log("Setting default category to:", sortedCategories[0]);
          setSelectedCategory(sortedCategories[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setCategoryLoading(false);
    }
  }, [selectedCategory]);

  // Fetch all operators
  const fetchAllOperators = useCallback(
    async (category = selectedCategory) => {
      console.log(`Fetching operators for category: ${category}`);
      setLoading(true);
      setError("");

      try {
        // Prepare request with category
        const requestData = {
          category: category !== "all" ? category : undefined,
        };

        // Remove undefined values
        Object.keys(requestData).forEach(
          (key) => requestData[key] === undefined && delete requestData[key],
        );

        console.log("1. Request data:", requestData);
        console.log("2. Stringified:", JSON.stringify(requestData));

        const encReq = DataEncrypt(JSON.stringify(requestData));
        console.log("3. Encrypted:", encReq);

        // Send request
        console.log(
          "4. Sending to: /api/operator/8a6bb5e0bc0e95eec947e2327b2278d137373901",
        );

        const response = await api.post(
          "/api/operator/8a6bb5e0bc0e95eec947e2327b2278d137373901",
          { encReq },
        );

        console.log("5. Response status:", response.status);
        console.log("6. Response headers:", response.headers);
        console.log("7. Response data:", response.data);

        // Try to decrypt response
        if (response.data) {
          console.log("8. Attempting to decrypt response...");

          let decryptedData;
          if (typeof response.data === "string") {
            console.log("9. Response is string, decrypting directly");
            decryptedData = DataDecrypt(response.data);
          } else if (
            response.data.data &&
            typeof response.data.data === "string"
          ) {
            console.log("9. Response has data field, decrypting that");
            decryptedData = DataDecrypt(response.data.data);
          } else {
            console.log("9. Response is not encrypted, using as-is");
            decryptedData = response.data;
          }

          console.log("10. Decrypted data:", decryptedData);

          // Extract operators
          let operators = [];
          if (decryptedData?.status === 200) {
            operators = decryptedData.data || [];
          } else if (Array.isArray(decryptedData)) {
            operators = decryptedData;
          }

          console.log("11. Operators found:", operators.length);

          // Process operators
          const processed = operators.map((op) => ({
            id: op.id,
            operator_name: op.operator_name || "N/A",
            description: op.description || "No description",
            category: op.category || "Uncategorized",
            image: op.image || "",
            status: op.status || 1,
            created_on: op.created_on ? dayjs(op.created_on) : dayjs(),
            biller_id: op.biller_id || "",
          }));

          setAllData(processed);
          setShowServiceTrans(processed);
        }
      } catch (err) {
        console.error("Error in fetchAllOperators:", err);
        if (err.response) {
          console.error("Error response status:", err.response.status);
          console.error("Error response data:", err.response.data);
          console.error("Error response headers:", err.response.headers);
        }
        setError(err.message || "Failed to load operators");
        setAllData([]);
        setShowServiceTrans([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory],
  );

  // Handle category change
  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;
    console.log("Category changed to:", newCategory);
    setSelectedCategory(newCategory);
    // Fetch operators for the new category
    fetchAllOperators(newCategory);
  };

  // Load initial data
  useEffect(() => {
    console.log("OperatorsReport component mounted");
    fetchCategories();
  }, [fetchCategories]);

  // Fetch operators when categories are loaded and selectedCategory is set
  useEffect(() => {
    if (categories.length > 0 && selectedCategory !== "all") {
      console.log("Initial fetch with category:", selectedCategory);
      fetchAllOperators(selectedCategory);
    }
  }, [categories, selectedCategory, fetchAllOperators]);

  // Helper function to apply filters to data (client-side filtering)
  const applyFiltersToData = useCallback(
    (data) => {
      console.log("Applying client-side filters to data:", data.length);

      let filtered = [...data];

      // Search filter
      if (searchTerm && searchTerm.trim() !== "") {
        const q = searchTerm.trim().toLowerCase();
        filtered = filtered.filter((item) => {
          const name = (item.operator_name || "").toString().toLowerCase();
          const desc = (item.description || "").toString().toLowerCase();
          return name.includes(q) || desc.includes(q);
        });
      }

      // Status filter
      if (selectedStatus !== "all") {
        const statusVal = selectedStatus === "active" ? 1 : 2;
        filtered = filtered.filter((item) => Number(item.status) === statusVal);
      }

      // Date range filter
      if (fromDate && toDate) {
        const start = dayjs(fromDate).startOf("day");
        const end = dayjs(toDate).endOf("day");

        filtered = filtered.filter((item) => {
          if (!item.created_on || !item.created_on.isValid) return false;
          return item.created_on.isBetween(start, end, null, "[]");
        });
      }

      console.log("Filtered data count:", filtered.length);
      setShowServiceTrans(filtered);
    },
    [searchTerm, selectedStatus, fromDate, toDate],
  );

  // Apply client-side filters when they change
  useEffect(() => {
    if (allData.length > 0) {
      console.log("Client-side filters changed, reapplying...");
      applyFiltersToData(allData);
    }
  }, [
    searchTerm,
    selectedStatus,
    fromDate,
    toDate,
    allData,
    applyFiltersToData,
  ]);

  const handleResetFilters = () => {
    console.log("Resetting filters");
    setSearchTerm("");
    setSelectedStatus("all");
    if (categories.length > 0) {
      setSelectedCategory(categories[0]);
      // Fetch operators for the first category
      fetchAllOperators(categories[0]);
    }
    setFromDate(dayjs().startOf("month"));
    setToDate(dayjs());
  };

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    fetchCategories();
    if (selectedCategory !== "all") {
      fetchAllOperators(selectedCategory);
    }
  };
const statsCards = [
  {
    label: "Total Operators",
    value: allData.length,
    color: "#FF6B35",
    icon: "📊",
    bgColor: "#FFF2ED",
  },
  {
    label: "Active",
    value: allData.filter((r) => Number(r.status) === 1).length,
    color: "#00C853",
    icon: "✅",
    bgColor: "#F0FFF4",
  },
  {
    label: "Inactive",
    value: allData.filter((r) => Number(r.status) === 2).length,
    color: "#5C6BC0",
    icon: "❌",
    bgColor: "#F0F2FF",
  },
  {
    label: "Deleted",
    value: allData.filter((r) => Number(r.status) === 0).length,
    color: "#D32F2F",
    icon: "🗑️",
    bgColor: "#FFEBEE",
  },
];

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* Header Section */}
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
            Operators Report
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
              href="/add-new-operator"
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
              Add Operator
            </Button>
          </Box>
        </Box>

        {/* Stats Grid */}
        <StatCardComponent statsCards={statsCards} />

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError("")}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
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
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FilterAltIcon sx={{ fontSize: 18, color: "#667eea" }} />
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "#667eea" }}
                >
                  Filter Operators
                </Typography>
              </Box>

              {/* Search Field */}
              <TextField
                placeholder="Search operators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: "grey.500", mr: 1 }} />,
                }}
                size="small"
                sx={{ minWidth: 250 }}
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

              {/* Category Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={handleCategoryChange}
                  disabled={categoryLoading || loading}
                >
                  {categories.map((category, index) => (
                    <MenuItem key={index} value={category}>
                      {category}
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
                      textField: { size: "small", sx: { width: 140 } },
                    }}
                  />
                  <Typography>to</Typography>
                  <DatePicker
                    value={toDate}
                    onChange={(d) => setToDate(d || dayjs())}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { size: "small", sx: { width: 140 } },
                    }}
                  />
                </Box>
              </LocalizationProvider>

              <Button
                variant="contained"
                onClick={handleResetFilters}
                size="small"
              >
                Reset
              </Button>
            </Box>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {searchTerm && (
                  <Chip
                    label={`Search: ${searchTerm}`}
                    size="small"
                    onDelete={() => setSearchTerm("")}
                  />
                )}
                {selectedStatus !== "all" && (
                  <Chip
                    label={`Status: ${selectedStatus}`}
                    size="small"
                    onDelete={() => setSelectedStatus("all")}
                  />
                )}
                {selectedCategory !== "all" && (
                  <Chip
                    label={`Category: ${selectedCategory}`}
                    size="small"
                    onDelete={() => {
                      if (categories.length > 0) {
                        setSelectedCategory(categories[0]);
                        fetchAllOperators(categories[0]);
                      }
                    }}
                  />
                )}
                {!fromDate.isSame(dayjs().startOf("month"), "day") && (
                  <Chip
                    label={`From: ${fromDate.format("DD/MM/YY")}`}
                    size="small"
                    onDelete={() => setFromDate(dayjs().startOf("month"))}
                  />
                )}
                {!toDate.isSame(dayjs(), "day") && (
                  <Chip
                    label={`To: ${toDate.format("DD/MM/YY")}`}
                    size="small"
                    onDelete={() => setToDate(dayjs())}
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
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "grey.600", fontWeight: 600 }}
          >
            Showing {showServiceTrans.length} operators
            {selectedCategory !== "all"
              ? ` in ${selectedCategory} category`
              : ""}
            {hasActiveFilters ? " (filtered)" : ""}
            {loading ? " (Loading...)" : ""}
          </Typography>
        </Box>

        {/* Operators Table */}
        <Box
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            bgcolor: "white",
          }}
        >
          <OperatorsTransactions
            loading={loading}
            showServiceTrans={showServiceTrans}
            onOperatorUpdate={fetchAllOperators} // CHANGED: Pass function directly
          />
        </Box>
      </Box>
    </Layout>
  );
}

export default withAuth(OperatorsReport);


// get-operators.js cha code