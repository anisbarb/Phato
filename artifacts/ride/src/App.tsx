import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

const DriverHome = lazy(() => import("@/pages/DriverHome"));
const PassengerHome = lazy(() => import("@/pages/PassengerHome"));

function Loader() {
  return <div className="fixed inset-0 bg-white" />;
}

export default function App() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Suspense fallback={<Loader />}>
        <Switch>
          <Route path="/" component={DriverHome} />
          <Route path="/driver" component={DriverHome} />
          <Route path="/passenger" component={PassengerHome} />
          <Route component={DriverHome} />
        </Switch>
      </Suspense>
    </WouterRouter>
  );
}
