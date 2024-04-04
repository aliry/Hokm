import React from 'react';
import { MainContainer } from './MainContainer';
import CardHand from './CardHand';
import PlayingTable from './PlayingTable';

const sampleCards = [
  "clubs_2",
  "hearts_5",
  "spades_9",
  "diamonds_king",
  "clubs_10",
  "hearts_jack",
  "spades_queen",
  "diamonds_ace",
  "clubs_7",
  "hearts_3",
  "spades_king",
  "diamonds_2",
  "clubs_ace",
];

function App() {
  return (
    // <div style={{ margin: 50, display: "flex", flexDirection: "column" }}>
    //   <div style={{ flex: 0 }}>
    //     <PlayingTable
    //       activeUser="Player 1"
    //       partner="Player 2"
    //       opponent1="Player 3"
    //       opponent2="Player 4"
    //       activeUserCard='clubs_2'
    //       partnerCard='spades_9'
    //       opponent1Card='diamonds_ace'
    //       opponent2Card='spades_king'
    //     />
    //   </div>
    //   <div style={{ flex: 1 }} >
    //     <CardHand cards={sampleCards} />
    //   </div>
    // </div>
    <MainContainer />
  );
}


export default App;
