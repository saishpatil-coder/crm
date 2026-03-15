"use client";
import React from "react";

import {
  Box,
  Button ,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Divider,
  Grid,
} from "@mui/material";

import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";

const Transactions = ({ showServiceTrans }) => {
  const rows = showServiceTrans || [];

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);
  const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
    background: "#fff",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTop: "1px solid #e0e0e0",
    marginTop: 0,
    ".MuiTablePagination-spacer": {
      flex: "1 1 0%",
    },
    ".MuiTablePagination-select": {
      color: "#2196f3",
      fontWeight: 600,
      paddingRight: "24px",
    },
    ".MuiTablePagination-selectLabel": {
      color: "#666",
      fontWeight: 500,
    },
    ".MuiTablePagination-displayedRows": {
      color: "#666",
      fontWeight: 500,
    },
    ".MuiTablePagination-actions": {
      ".MuiIconButton-root": {
        color: "#2196f3",
        "&:hover": {
          backgroundColor: "rgba(33, 150, 243, 0.08)",
        },
        "&.Mui-disabled": {
          color: "#ccc",
        },
      },
    },
    ".MuiTablePagination-selectIcon": {
      color: "#2196f3",
    },
    ".MuiTablePagination-menuItem": {
      padding: "4px 16px",
    },
    ".MuiTablePagination-selectRoot": {
      marginRight: "32px",
    },
    ".MuiTablePagination-toolbar": {
      minHeight: "52px",
      padding: "0 16px",
      flexWrap: "wrap",
      gap: "4px",
    },
  }));
  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      background: "#2198f3",
      color: "white",
      fontSize: 12,
      padding: 7,
      whiteSpace: "nowrap",
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 12,
      padding: 7,
      whiteSpace: "nowrap",
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
  }));

  // Status Chip Component
  const StatusChip = ({ status }) => {
    const getStatusConfig = (status) => {
      const statusMap = {
        ACTIVE: { color: "#10B981", bg: "#ECFDF5", label: "Success" },
        active: { color: "#10B981", bg: "#ECFDF5", label: "Success" },
        inactive: { color: "#EF4444", bg: "#FEF2F2", label: "Failed" },
        INACTIVE: { color: "#EF4444", bg: "#FEF2F2", label: "Failed" },
        Active: { color: "#10B981", bg: "#ECFDF5", label: "Success" },
        Inactive: { color: "#EF4444", bg: "#FEF2F2", label: "Failed" },
        pending: { color: "#F59E0B", bg: "#FFFBEB", label: "Pending" },
        HOLD: { color: "#8B5CF6", bg: "#F5F3FF", label: "Hold" },
        hold: { color: "#8B5CF6", bg: "#F5F3FF", label: "Hold" },
      };

      return (
        statusMap[status] || {
          color: "#6B7280",
          bg: "#F9FAFB",
          label: status || "Unknown",
        }
      );
    };

    const config = getStatusConfig(status);

    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: "4px",
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.color}`,
          fontSize: "0.65rem",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {config.label}
      </Box>
    );
  };

  return (
    <main className="p-6 space-y-6">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 420,
              overflowY: "auto",
              overflowX: "auto",
              position: "relative",
            }}
          >
            <Divider />

            <Table
              stickyHeader
              aria-label="Access Report"
              sx={{ minWidth: "1500px", width: "100%" }}
            >
              <TableHead>
                <TableRow>
                  <StyledTableCell
                    style={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                  >
                    Sl No.
                  </StyledTableCell>

                  <StyledTableCell
                    style={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                  >
                    Operator
                  </StyledTableCell>
                  <StyledTableCell
                    style={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                  >
                    Status
                  </StyledTableCell>

                  <StyledTableCell
                    style={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                  >
                    Action
                  </StyledTableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length > 0 ? (
                  (rowsPerPage > 0
                    ? rows.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                    : rows
                  ).map((row, index) => (
                    <StyledTableRow key={index}>
                      <StyledTableCell>
                        {index + 1 + page * rowsPerPage}
                      </StyledTableCell>

                      <StyledTableCell>
                        {row.operator_name || "-"}
                      </StyledTableCell>

                      <StyledTableCell>
                        <StatusChip status={row.status} />
                      </StyledTableCell>

                      <StyledTableCell>
                        {(() => {
                          const currentStatus = (
                            row.status || ""
                          ).toUpperCase();
                          const isActive = currentStatus === "ACTIVE";

                          return (
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                backgroundColor: isActive
                                  ? "#EF4444"
                                  : "#10B981",
                                "&:hover": {
                                  backgroundColor: isActive
                                    ? "#DC2626"
                                    : "#059669",
                                },
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                padding: "4px 12px",
                                boxShadow: "none",
                              }}
                            >
                              {isActive ? "Inactive" : "Active"}
                            </Button>
                          );
                        })()}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={14}>
                      <Typography
                        color="error"
                        textAlign="center"
                        sx={{ padding: 2 }}
                      >
                        No Records Found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <StyledTablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Grid>
      </Grid>
    </main>
  );
};

export default Transactions;

