import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-16">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 text-gray-800">Welcome to Our Cricket Management App</h1>
        <p className="text-lg md:text-xl text-center mb-8 text-gray-600">
          Explore the world of cricket with our comprehensive management tools.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/login">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Sign In as Manageer
            </button>
          </Link>
          <Link to="/sign-up">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Sign in as Player
            </button>
          </Link>
        </div>
      </div>
      <div className="mt-8 bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">About Cricket</h2>
        <p className="text-gray-600 mb-4">
          Cricket is a bat-and-ball game played between two teams of eleven players on a field at the centre of which is a rectangular pitch with a wicket at each end, each comprising two bails balanced on three stumps.
        </p>
        <p className="text-gray-600 mb-4">
          The game proceeds when a player of the fielding team, called the bowler, delivers (i.e., bowls) the ball from one end of the pitch towards the wicket at the other end, with an "over" being completed if the bowler bowls six deliveries. The batting side scores runs either when the ball reaches or crosses the boundary in which case the batsmen need not run or when the two batsmen at the wicket, known as batsmen, run between the wickets.
        </p>
        <p className="text-gray-600">
          The game is played in various formats, ranging from Twenty20, played over a few hours, to Test matches, played over five days. The Laws of Cricket are maintained by the International Cricket Council (ICC) and the Marylebone Cricket Club (MCC) with additional Standard Playing Conditions for international matches.
        </p>
      </div>
    </div>
  );
};

export default Home;
