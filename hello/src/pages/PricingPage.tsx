import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import ComparisonTable from "@/components/ComparisonTable";

const PricingPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Pricing />
      <ComparisonTable />
      <Footer />
    </div>
  );
};

export default PricingPage;