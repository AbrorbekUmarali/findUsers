import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  //request loading
  const [requests, setRequests] = useState(0);
  const [error, setError] = useState({ show: false, msg: "" });
  const [isLoading, setIsLoading] = useState(false);
  //search user
  const searchGithubUser = async (user) => {
    //toggleError
    toggleError();
    //loading
    setIsLoading(true);
    // getting data
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    //print response tree
    console.log(response);
    // if response is exit and has data then save data as new user's details

    if (response) {
      setGithubUser(response.data);

      const { login, followers_url } = response.data;
      //************************************************************************/ */
      //better way to get data from two apis
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          //if got data from Api then status will 'fulfilled', else status will 'rejected'
          const status = "fulfilled";

          if (repos.status === status) {
            // check successfully or not
            setRepos(repos.value.data); // set repo data
          }
          if (followers.status === status) {
            //check successfully or not
            setFollowers(followers.value.data); //set followers data
          }
        })
        .catch((err) => console.log(err));
      /*
      ****************************************
      Second way to get data, cons of this way, get response in different time, so, according circumstance, show in different time. 
      For instance firstly, repos. after that, followers. or respectively
      ****************************************
      //set repos data
      axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) =>
        setRepos(response.data)
      );

      //show respo data on console
      console.log("Repos", repos);
      //set followers data
      axios(`${followers_url}?per_page=100`).then((response) =>
        setFollowers(response.data)
      );

      //show followers data on console
      console.log("Followers", followers);
      ****************************************************************
      */
    } else {
      toggleError(true, " there is no user with that username");
    }

    // we check how many request avaliable
    checkRequests();
    // if everthing is ready to show, then we will do disable loading.
    setIsLoading(false);
  };

  //check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "Sorry, you have exceeded request");
        }
      })
      .catch((err) => console.log(err));
  };
  //error
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  useEffect(() => {
    checkRequests();
  }, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
