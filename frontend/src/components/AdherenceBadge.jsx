import React from "react";

export const AdherenceBadge = ({ score }) => {
  let color = "bg-red-100 text-red-800";
  if (score >= 90) color = "bg-green-100 text-green-800";
  else if (score >= 75) color = "bg-yellow-100 text-yellow-800";

  return (
    <span className={`px-2 py-1  text-xs font-bold ${color}`}>
      {score}%
    </span>
  );
};
