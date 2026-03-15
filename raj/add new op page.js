"use client";
import React, { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import withAuth from "../../utils/withAuth";
import { callAlert } from "../../redux/actions/alert";
import AddOperator from "@/components/OperatorManagement/AddOperators";
import Layout from "@/components/Dashboard/layout";

function AddOperatorPage() {
  return (
    <Layout>
      <AddOperator />
    </Layout>
  );
}

export default withAuth(AddOperatorPage);

// add-new-operator.js