import {
  Container,
  Button,
  VStack,
  HStack,
  Text,
  Avatar,
  Skeleton
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { generateChallenge, authenticate, getPublications } from '../utils';
import { useEffect, useState } from 'react';

export default function Home() {
  const {data} = useAccount();
  const address = data?.address;
  const connected = !!data?.address;

  const { signMessageAsync } = useSignMessage();
  const [posts, setPosts] = useState([]);
  const [signedIn, setSignedIn] = useState(false);

  const signIn = async() => {
    try {
      if (!connected) {
        return alert('Please connect your wallet first!');
      }
      const challenge = await generateChallenge(address);
      const signature = await signMessageAsync({
        message: challenge
      });
      const accessToken = await authenticate(address, signature);
      console.log({accessToken});
      window.sessionStorage.setItem('accessToken', accessToken);

      setSignedIn(true);
    } catch (error) {
      console.log(error);
      alert('Error signing in');
    }
  };

  useEffect(() => {
    getPublications().then(setPosts);
  }, []);

  return (
    <Container paddingY='10'>
      <ConnectButton showBalance={false} />

      {!signedIn && (<Button onClick={signIn} marginTop='2'>Login with Lens</Button>)}

      <VStack spacing={4} marginY='10'>
        {posts
          .filter((post) => post.__typename === 'Post') // we need to filter the list to make sure we are not rendering anything other than Posts, like comments and other formats.
          .map((post) => {
            return (
              <VStack
                key={post.id}
                borderWidth='0.7px'
                paddingX='4'
                paddingY='2'
                rounded='md'
                width='full'
                alignItems='left'
                as='a'
                href={`https://lenster.xyz/posts/${post.id}`}
                target='_blank'
                transition='all 0.2s'
                _hover={{
                  shadow: 'md',
                }}
              >
                <HStack>
                  <Avatar src={post.profile.picture} />
                  <Text fontWeight='bold' justifyContent='left'>
                    {post.profile?.handle || post.profile?.id}
                  </Text>
                </HStack>
                 <Text>{post.metadata?.content}</Text>
                <HStack textColor='gray.400'>
                  <Text>
                    {post.stats?.totalAmountOfComments} comments,
                  </Text>
                  <Text>
                    {post.stats?.totalAmountOfMirrors} mirrors,
                  </Text>
                  <Text>
                    {post.stats?.totalAmountOfCollects} collects
                  </Text>
                </HStack>
              </VStack>
            );
          })}

          {posts.length === 0 || !posts ? (
          <VStack>
            {[...Array(10)].map((_, idx) => {
              return <Skeleton key={idx} height='32' width='xl' rounded='md' />;
            })}
          </VStack>
        ) : null}
      </VStack>

    </Container>
  );
}

