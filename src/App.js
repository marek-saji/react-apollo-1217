/* eslint-disable no-console */

import React, { Component } from 'react';
import gql from 'graphql-tag';
import { ApolloProvider, Query } from 'react-apollo';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import packageJson from '../package.json';

console.group('init');

const query = gql`
    query Debug($id: ID!) {
        character(id: $id) {
            name
        }
    }
`;

class App extends Component {
    state = {
        client: null,
    };

    async componentDidMount() {
        const client = await this.getClient();
        this.setState({ client });
    }

    getClient = async () => {
        const cache = new InMemoryCache();
        const client = new ApolloClient({
            link: ApolloLink.from([
                new HttpLink({
                    uri: 'http://localhost:8080/graphql',
                    credentials: 'same-origin',
                }),
            ]),
            cache,
        });

        return client;
    };

    isQueryCached (client, query, variables) {
        const { complete } = client.cache.diff({
            query: client.cache.transformDocument(query),
            variables,
            returnPartialData: true,
            optimistic: false,
        });
        return complete;
    }

    fetch(id) {
        console.groupEnd();
        console.group('Fetching id=', id);
        this.setState({ id });
    }

    render() {
        const { client } = this.state;
        const { id } = this.state;

        if (!client) return 'Initializing client…';

        return (
            <ApolloProvider client={client}>
                <p>Using react-apollo {packageJson.dependencies['react-apollo']}.</p>
                <ol>
                    <li>
                        Open up JavaScript console
                    </li>
                    <li>
                        <button onClick={() => this.fetch(1000)}>
                            Fetch id=1000
                        </button>
                    </li>
                    <li>
                        <button onClick={() => this.fetch(2001)}>
                            Fetch id=2001
                        </button>
                    </li>
                    <li>
                        <button onClick={() => this.fetch(1000)}>
                            Fetch id=1000 again
                        </button>
                        <p>
                            Will get from cache.
                            Expecting for the callback to be called two times:
                        </p>
                        <ol>
                            <li>
                                loading=true, <strong>networkStatus=3</strong>
                            </li>
                            <li>
                                loading=false, networkStatus=7
                            </li>
                        </ol>
                    </li>
                </ol>
                <Query
                    query={query}
                    variables={{ id }}
                    fetchPolicy="cache-and-network"
                    skip={!id}
                >
                    {({ loading, data, variables, networkStatus, client }) => {
                        const complete = this.isQueryCached(client, query, variables);
                        console.group(
                            { loading, networkStatus },
                            'data:', data,
                            { complete }
                        );
                        let msg;
                        if (loading) msg = 'Loading…';
                        else if (data === undefined) msg = 'undefined';
                        else if (Object.keys(data).length === 0) msg = '{}';
                        else msg = `Fetched: ${data.character.name}`;
                        console.log(msg);
                        console.groupEnd();

                        return msg;
                    }}
                </Query>
            </ApolloProvider>
        );
    }
}

export default App;
