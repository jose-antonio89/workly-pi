import { Navigate, useLocation } from 'react-router';

export default function RouteAlias({ destination }) {
  const { search, hash } = useLocation();
  return <Navigate replace to={destination + search + hash} />;
}
