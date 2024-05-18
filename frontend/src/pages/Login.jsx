import React, { useState } from 'react';
import UserLogin from '../components/Auth/UserLogin';
import PlayerLogin from '../components/Auth/PlayerLogin';

const Login = () => {
    const [isManager, setIsManager] = useState(true);
    const [isPlayer, setPlayer]= useState(false)
    const select = 'text-white bg-gray-800';
    const unSelect = 'text-gray-800 bg-white';

  return (
    <div className="bg-gray-100 min-h-screen pt-6">
         <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg">
        <div className=" w-full rounded-md shadow-sm" role="group">
      <button
        type="button"
        className={`w-1/2 px-2 py-4  font-semibold rounded-t-lg ${isManager ? select : unSelect}`}
        onClick={()=>{setIsManager(true)
                setPlayer(false)}}
      >
    Login as a Manager
      </button>
     
      <button
        type="button"
        className={`w-1/2 px-2 py-4  font-semibold rounded-t-lg ${isPlayer ? select : unSelect}`}
        onClick={()=>{setIsManager(false)
            setPlayer(true)}}
      >
       Login as a Player
      </button>
    </div>
    <p className="text-gray-600  text-center p-6">
    {isManager ? 'Login to manage your team and oversee player activities.' : 'Login to access your player profile and manage your team and matches.'}
        </p>
        {isManager && <UserLogin/>}
        {isPlayer && <PlayerLogin/>}
      </div>
    </div>
    </div>
  );
};

export default Login;
