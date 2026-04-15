import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';

const MarketplacePlaceholder = () => {
    return (
        <div className="mp-placeholder-container">
            <div className="mp-icon-wrapper">
                <FontAwesomeIcon icon={faStore} />
            </div>

            <h1 className="mp-title">
                Marketplace
            </h1>
            
            <p className="mp-status-text">
                Coming after mid part
            </p>
        </div>
    );
};

export default MarketplacePlaceholder;
