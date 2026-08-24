// Real supabase-js query calls (`.from(...).select(...).eq(...)`, etc.)
// return a thenable builder -- each filter method returns the same builder,
// and `await`-ing it (at any point in the chain) resolves to {data, error}.
// This stands in for that shape so hooks under test can be driven without a
// real network call: chain as much as the hook needs, then resolve to
// whatever `result` this call was set up to return.
export function fakeQueryResult(result = { data: null, error: null }) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    maybeSingle: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}
