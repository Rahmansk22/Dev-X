import Navbar from "@/modules/home/ui/components/navbar";
import { Footer } from "@/modules/home/ui/components/footer";

interface Props {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <div className="absolute inset-0 bg-black -z-10 h-full w-full" />
      <div className="flex-1 flex flex-col pt-16">
        {children}
      </div>
      <Footer />
    </main>
  );
};

export default Layout;
