import { Switch, Route } from "wouter";

import PassengerHome from "./pages/PassengerHome";
import DriverHome from "./pages/DriverHome";

function RoleSelect() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-5xl font-bold">Phato</h1>

        <p className="text-gray-500">
          Smart local transport for passengers and drivers.
        </p>

        <a
          href="/passenger"
          className="block w-full rounded-2xl bg-black text-white py-4 text-lg font-semibold"
        >
          Continue as Passenger
        </a>

        <a
          href="/driver"
          className="block w-full rounded-2xl border border-black py-4 text-lg font-semibold"
        >
          Continue as Driver
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={RoleSelect} />
      <Route path="/passenger" component={PassengerHome} />
      <Route path="/driver" component={DriverHome} />
    </Switch>
  );
}
