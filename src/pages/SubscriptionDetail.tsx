
import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SubscriptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const subscriptionName = id === "netflix" 
    ? "Netflix Standard Plan" 
    : id === "amazon-prime" 
      ? "Amazon Prime Subscription"
      : "Subscription";

  return (
    <div className="container max-w-md mx-auto p-4">
      <Link to="/?tab=expenses#expense-intelligence-card">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>
      
      <h1 className="text-2xl font-bold mb-4">{subscriptionName}</h1>
      <p className="text-gray-500">Subscription details will be added here.</p>
    </div>
  );
};

export default SubscriptionDetail;
