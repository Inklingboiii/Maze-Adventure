import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './ProgressBar.css';

function ProgressBar({ progress, isLoading }) {
	useEffect(() => {
		console.log('state updated', progress, isLoading);
	});
	if(isLoading) {
		return(
			<article className={'progress-bar'}>
				{ progress }
			</article>
		);
	} else {
		return(
			<h1 className={'progress-bar'}>not loading</h1>
		);
	}
}

ProgressBar.propTypes = {
	progress: PropTypes.number,
	isLoading: PropTypes.bool
};
export default ProgressBar;