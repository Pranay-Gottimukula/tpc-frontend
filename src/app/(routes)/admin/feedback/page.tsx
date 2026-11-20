"use client";

import { fetchAllFeedbacks, fetchFeedbackById } from "@/helpers/api";
import Table from "@/components/NewTableComponent/Table";
import { createMRTColumnHelper } from "material-react-table";
import { useEffect, useRef, useState } from "react";
import Loader from "@/components/Loader/loader";
import { generateFeedbackPdf } from "@/utils/generateFeedbackPdf";
import { message } from "antd";

const columnHelper = createMRTColumnHelper<any>();

const columns = [
  columnHelper.accessor("recruiterName", { header: "Recruiter Name" }),
  columnHelper.accessor("recruiterEmail", { header: "Recruiter Email" }),
  columnHelper.accessor("recruiterDesignation", { header: "Designation" }),
  columnHelper.accessor("companyName", { header: "Company" }),
  columnHelper.accessor("seasonYear", { header: "Season Year" }),
  columnHelper.accessor("seasonType", { header: "Season Type" }),
  columnHelper.accessor("createdAt", {
    header: "Submitted On",
    Cell: ({ cell }) =>
      new Date(cell.getValue()).toLocaleDateString(),
  }),
];

const FeedbackPage = () => {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const downloading = useRef(false);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchAllFeedbacks();
        if (Array.isArray(data)) setFeedbacks(data);
        else message.error("Failed to load feedback");
      } catch {
        message.error("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-gray-200 px-6 py-4">
      <h1 className="text-center font-bold text-3xl my-5">
        Recruiter Feedback
      </h1>

      <Table
        data={feedbacks}
        columns={columns}
        type="feedback"
        buttonText="Download Selected Feedbacks (PDF)"
        buttonAction={async (selectedRows: any[]) => {
          if (downloading.current) return;
          if (!selectedRows || selectedRows.length === 0) return;

          downloading.current = true;
          const rows = selectedRows.slice(0, 50);
          const loadingKey = "feedback-pdf-download";

          try {
            if (selectedRows.length > 50) {
              message.warning("Only the first 50 selected feedbacks will be downloaded");
            }
            message.loading({ content: "Preparing feedback PDF...", key: loadingKey, duration: 0 });

            const fullFeedbacks = [];
            let failed = 0;
            for (const row of rows) {
              try {
                const feedback = await fetchFeedbackById(row.id);
                if (feedback?.id) fullFeedbacks.push(feedback);
                else failed += 1;
              } catch {
                failed += 1;
              }
            }

            if (fullFeedbacks.length > 0) {
              generateFeedbackPdf(fullFeedbacks, {
                fileName: "Recruiter_Feedbacks.pdf",
              });
            }
            if (failed > 0) {
              message.warning(`Failed to load ${failed} feedback record${failed === 1 ? "" : "s"}`);
            }
          } catch {
            message.error("Failed to prepare feedback PDF");
          } finally {
            message.destroy(loadingKey);
            downloading.current = false;
          }
        }}
      />
    </div>
  );
};

export default FeedbackPage;
