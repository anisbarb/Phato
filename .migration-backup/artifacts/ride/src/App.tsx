import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import RoleSelect from "@/pages/RoleSelect";
import PassengerHome from "@/pages/PassengerHome";
import DriverHome from "@/pages/DriverHome";

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/" component={RoleSelect} />
        <Route path="/passenger" component={PassengerHome} />
        <Route path="/driver" component={DriverHome} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </WouterRouter>
  );
}

export default App;
