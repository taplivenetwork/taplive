# GraphQL Example — Risk Label

```graphql
query GetReplayLabel($id: ID!) {
  replay(id: $id) {
    id
    riskLabel
    updatedAt
  }
}

subscription OnRiskLabelUpdated($id: ID!) {
  riskLabelUpdated(replayId: $id) {
    replayId
    riskLabel
    updatedAt
  }
}
```
> Public fields only; private attributes are omitted.
