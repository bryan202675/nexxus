// Demo-only stand-ins for "the team/user currently signed in" — this project has no backend,
// so Manager/User dashboards scope the shared mock dataset against these fixed values.
export const DEMO_MANAGER_TEAM = "Alpha";
export const DEMO_USER_ID = "user-1";

export const filterByScope = (rows, dataScope, rowLimit) => {
  let scoped = rows;
  if (dataScope === "team") {
    scoped = rows.filter((row) => row.team === DEMO_MANAGER_TEAM);
  } else if (dataScope === "own") {
    scoped = rows.filter((row) => row.ownerId === DEMO_USER_ID);
  }
  return typeof rowLimit === "number" ? scoped.slice(0, rowLimit) : scoped;
};
