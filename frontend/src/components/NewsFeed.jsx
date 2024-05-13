import React from 'react';

const NewsFeed = ({ news }) => {
  return (
    <section className="news-feed bg-white shadow-md py-4">
      <h2 className="text-2xl font-bold mb-2">News Feed</h2>
      <ul className="flex flex-wrap justify-center">
        {news.map((item) => (
          <li key={item.id} className="news-item">
            <h3 className="text-lg font-bold">{item.headline}</h3>
            <p className="text-gray-600">{item.snippet}</p>
            <a href={item.sourceLink} className="text-blue-500 hover:text-blue-700">Read More</a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default NewsFeed;