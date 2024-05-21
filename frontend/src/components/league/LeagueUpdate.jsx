// frontend/components/LeagueUpdate/LeagueUpdate.js
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeagueById, updateLeague } from "../../store/slices/LeagueSlice";
import { useParams, useNavigate } from "react-router-dom";

const LeagueUpdate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentLeague, loading, error } = useSelector(
    (state) => state.league
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchLeagueById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentLeague) {
      setName(currentLeague.name);
      setDescription(currentLeague.description);
    }
  }, [currentLeague]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const leagueData = new FormData();
    leagueData.append("name", name);
    leagueData.append("description", description);
    if (logo) {
      leagueData.append("logo", logo);
    }

    dispatch(updateLeague({ id, leagueData }))
      .unwrap()
      .then(() => {
        alert("League updated successfully");
        navigate(`/leagues/${id}`);
      })
      .catch((err) => {
        console.error("Error updating league:", err);
        alert("An error occurred while updating league");
      });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Update League</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {currentLeague && (
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e)=>{setName(e.target.value)}}
            required
          />
          <label>Description:</label>
          <textarea
            name="description"
            value={description}
            onChange={(e)=>{setDescription(e.target.value)}}
            required
          />
          <label>Logo:</label>
          <input type="file" name="logo" onChange={(e)=>{setLogo(e.target.files[0])}} />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >
            Update League
          </button>
        </form>
      )}
    </div>
  );
};

export default LeagueUpdate;
