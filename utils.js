// utils.js
import {
    ApolloClient,
    ApolloLink,
    HttpLink,
    InMemoryCache,
    gql
  } from '@apollo/client';
  
const API_URL = 'https://api.lens.dev/';
  
  // `httpLink` our gateway to the Lens GraphQL API. It lets us request for data from the API and passes it forward
const httpLink = new HttpLink({ uri: API_URL });
  
  /* `authLink` takes care of passing on the access token along with all of our requests. We will be using session storage to store our access token. 
  
  The reason why we have to account for an access token is that that's what the Lens API uses to authenticate users. This is the token you'll get back when someone successfully signs in. We need to pass this token along with all the requests we made to the API that *need* authentication.
  */
const authLink = new ApolloLink((operation, forward) => {
      const token = sessionStorage.getItem('accessToken');
  
      operation.setContext({
          headers: {
              'x-access-token': token ? `Bearer ${token}` : '',
          },
      });
  
      return forward(operation);
  });
  
export const apolloClient = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
  });

const GET_CHALLENGE = `
    query($request: ChallengeRequest!) {
        challenge(request: $request) { text }
    }
`;

export const generateChallenge = async (address) => {
    const res = await apolloClient.query({
        query: gql(GET_CHALLENGE),
        variables: {
            request: {
                address,
            }
        }
    });
    return res.data.challenge.text;
}
  

const AUTHENTICATION = `
  mutation($request: SignedAuthChallenge!) {
    authenticate(request: $request) {
      accessToken
      refreshToken
    }
 }
`;

export const authenticate = async (address, signature) => {
  const { data } = await apolloClient.mutate({
    mutation: gql(AUTHENTICATION),
    variables: {
      request: {
        address,
        signature,
      },
    },
  });
  return data.authenticate.accessToken;
};

const GET_PUBLICATIONS_QUERY = `
query {
  explorePublications(request: {
    sortCriteria: TOP_COMMENTED,
    publicationTypes: [POST],
    limit: 20
  }) {
    items {
      __typename
      ... on Post {
        ...PostFields
      }
    }
  }
}

fragment ProfileFields on Profile {
  id
  name
  metadata
  handle
  picture {
    ... on NftImage {
      uri
    }
    ... on MediaSet {
      original {
        ...MediaFields
      }
    }
  }
  stats {
    totalComments
    totalMirrors
    totalCollects
  }
}

fragment MediaFields on Media {
  url
}

fragment PublicationStatsFields on PublicationStats {
  totalAmountOfMirrors
  totalAmountOfCollects
  totalAmountOfComments
}

fragment MetadataOutputFields on MetadataOutput {
    content
  media {
    original {
      ...MediaFields
    }
  }
}

fragment PostFields on Post {
  id
  profile {
    ...ProfileFields
  }
  stats {
    ...PublicationStatsFields
  }
  metadata {
    ...MetadataOutputFields
  }
}
  `;

// publications = posts in Lens lingo
export const getPublications = async () => {
  const { data } = await apolloClient.query({
    query: gql(GET_PUBLICATIONS_QUERY),
  });
  return data.explorePublications.items;
};
