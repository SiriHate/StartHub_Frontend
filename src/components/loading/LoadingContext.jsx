import React, { createContext, useState } from 'react';

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    const setLoadingState = (state) => {
        setLoading(state);
    };

    return (
        <LoadingContext.Provider value={{ loading, setLoadingState }}>
            {children}
        </LoadingContext.Provider>
    );
};

export default LoadingContext;