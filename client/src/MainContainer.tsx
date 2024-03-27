import { GameEvent } from "./constants";
import React from "react";
import axios from "axios";
const serverURL = "http://localhost:3001";
const players = ["P1-Manager", "P2", "P3", "P4"];


export const MainContainer = () => {
  const handleEvent = (event: GameEvent) => {
    console.log(event);
  } 

  const handleJoinGame = () => {
    console.log("Join Game");
    axios.post(`${serverURL}/create-game`, {managerName: players[0]})
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div style={{display: "flex", gap: 10}}>
      <div style={{border:"1px black solid"}}>
        <div style={{border:"1px black dashed"}}>
            <button style={{padding: 15, margin: 5, color: "red"}} onClick={handleJoinGame}>Join Game</button>
        </div>
        {Object.entries(GameEvent).map(([key, value]) => (
          <div key={key}>
            <button 
              key={key} 
              style={{padding: 5, margin: 5}}
              onClick={() => handleEvent(value)}
            >
              {value}
            </button>
          </div>
        ))}
      </div>
      <div>
        <textarea rows={40} cols={150} />
      </div>    
    </div>
  );
}