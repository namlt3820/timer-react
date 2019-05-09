const Component = React.Component

class TimersDashboard extends Component {
	state = {
		timers: []
	}
	componentDidMount() {
		this.loadTimersFromServer()
		setInterval(this.loadTimersFromServer, 5000)
	}
	loadTimersFromServer = () => {
		client.getTimers(serverTimers => {
			this.setState({ timers: serverTimers })
		})
	}
	handleCreateFormSubmit = (timer) => {
		this.createTimer(timer)
	}
	handleEditFormSubmit = attrs => {
		this.updateTimer(attrs)
	}
	updateTimer = (attrs) => {
		this.setState({
			timers: this.state.timers.map(timer => {
				if (timer.id === attrs.id) {
					return Object.assign({}, timer, attrs)
				} else {
					return timer
				}
			})
		})
		client.updateTimer(attrs)
	}
	createTimer = (timer) => {
		const t = helpers.newTimer(timer)
		this.setState({
			timers: this.state.timers.concat(t)
		})
		client.createTimer(t)
	}
	handleDeleteTimer = (id) => {
		this.deleteTimer(id)
	}
	deleteTimer = id => {
		this.setState({
			timers: this.state.timers.filter(timer => timer.id !== id)
		})
		client.deleteTimer({ id })
	}
	handleStartClick = id => this.startTimer(id)
	handleStopClick = id => this.stopTimer(id)
	startTimer = id => {
		const now = Date.now()
		this.setState({
			timers: this.state.timers.map(timer => {
				return (timer.id === id) ? (
					Object.assign({}, timer, { runningSince: now })
				) : (timer)
			})
		})
		client.startTimer({ id, start: now })
	}
	stopTimer = id => {
		const now = Date.now()
		this.setState({
			timers: this.state.timers.map(timer => {
				if (timer.id === id) {
					const lastElapsed = now - timer.runningSince
					return Object.assign({}, timer, {
						elapsed: timer.elapsed + lastElapsed,
						runningSince: null
					})
				} else {
					return timer
				}
			})
		})
		client.stopTimer({ id, stop: now })
	}
	render() {
		return (
			<div className="ui three column centered grid">
				<div className="column">
					<EditableTimerList 
						onStartClick={this.handleStartClick}
						onStopClick={this.handleStopClick}
						onDeleteClick={this.handleDeleteTimer}
						onFormSubmit={this.handleEditFormSubmit}
						timers={this.state.timers} 
					/>
					<ToggleableTimerForm onFormSubmit={this.handleCreateFormSubmit} />
				</div>
			</div>
		)
	}
}

class EditableTimerList extends Component {
	render() {
		const timers = this.props.timers.map(timer => (
			<EditableTimer 
				key={timer.id} 
				{...timer} 
				{...this.props}
			/>
		))
		return (
			<div id="timers">
				{timers}
			</div>
		)
	}
}

class EditableTimer extends Component {
	state = {
		editFormOpen: false
	}
	openForm = () => this.setState({ editFormOpen: true })
	closeForm = () => this.setState({ editFormOpen: false })
	handleEditClick = () => this.openForm()
	handleFormClose = () => this.closeForm()
	handleSubmit = (timer) => {
		this.props.onFormSubmit(timer)
		this.closeForm()
	} 
	render() {
		return (this.state.editFormOpen) ? 
			<TimerForm 
				{...this.props} 
				onFormSubmit={this.handleSubmit}
				onFormClose={this.handleFormClose}
			/> :
			<Timer 
				{...this.props} 
				onEditClick={this.handleEditClick}
			/>
	}
}

class TimerForm extends Component {
	state = {
		title: this.props.title || '',
		project: this.props.project || ''
	}
	handleTitleChange = e => {
		this.setState({ title: e.target.value })
	}
	handleProjectChange = e => {
		this.setState({ project: e.target.value })
	}
	handleSubmit = () => {
		const 
			{ title, project } = this.state,
			{ id, onFormSubmit } = this.props
		onFormSubmit({ id, title, project })
	}
	render() {
		const { title, project } = this.state
		const { id, onFormClose } = this.props
		const submitText = id ? 'Update' : 'Create'
		return (
			<div className="ui centered card">
				<div className="content">
					<div className="ui form">
						<div className="field">
							<label>Title</label>
							<input type="text" value={title} onChange={this.handleTitleChange} />
						</div>
						<div className="field">
							<label>Project</label>
							<input type="text" value={project} onChange={this.handleProjectChange} />
						</div>
						<div className="ui two bottom attached buttons">
							<button onClick={this.handleSubmit} className="ui basic blue button">{submitText}</button>
							<button onClick={onFormClose} className="ui basic red button">Cancel</button>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

class Timer extends Component {
	componentDidMount() {
		this.forceUpdateInterval = setInterval(() => this.forceUpdate(), 50)
	}
	componentWillUnmount() {
		clearInterval(this.forceUpdateInterval)
	}
	handleDeleteTimer = () => {
		const { id, onDeleteClick } = this.props
		onDeleteClick(id)
	}
	handleStartClick = () => {
		const { id, onStartClick } = this.props
		onStartClick(id)
	}
	handleStopClick = () => {
		const { id, onStopClick } = this.props
		onStopClick(id)
	}
	render() {
		const 
			{ elapsed, runningSince, title, project, onEditClick } = this.props,
			elapsedString = helpers.renderElapsedString(elapsed, runningSince)
		return (
			<div className="ui centered card">
				<div className="content">
					<div className="header">
						{title}
					</div>
					<div className="meta">
						{project}
					</div>
					<div className="center aligned description">
						<h2>{elapsedString}</h2>
					</div>
					<div className='extra content'>
						<span 
							className='right floated edit icon'
							onClick={onEditClick}
						>
							<i className='edit icon' />
						</span>
						<span 
							className='right floated trash icon'
							onClick={this.handleDeleteTimer}
						>
							<i className='trash icon' />
						</span>
					</div>
				</div>
				<TimerActionButton 
					timerIsRunning={!!this.props.runningSince}
					onStartClick={this.handleStartClick}
					onStopClick={this.handleStopClick}
				/>
			</div>
		)
	}
}

class TimerActionButton extends Component {
	render() {
		const { timerIsRunning, onStartClick, onStopClick } = this.props
		return (timerIsRunning) ? (
			<div
				className="ui bottom attached red basic button"
				onClick={onStopClick}
			>
				Stop
			</div>
		) : (
			<div
				className="ui bottom attached green basic button"
				onClick={onStartClick}
			>
				Start
			</div>
		)
	}
}

class ToggleableTimerForm extends Component {
	state = {
		isOpen: false
	}
	handleFormOpen = () => {
		this.setState({ isOpen: true })
	}
	handleFormClose = () => {
		this.setState({ isOpen: false })
	}
	handleFormSubmit = (timer) => {
		this.props.onFormSubmit(timer)
		this.setState({ isOpen: false })
	}
	render() {
		return (this.state.isOpen) ? 
			(
				<TimerForm 
					onFormClose={this.handleFormClose}
					onFormSubmit={this.handleFormSubmit}
				/> 
			): (
			<div className='ui basic content center aligned segment'>
          <button 
						className='ui basic button icon'
						onClick={this.handleFormOpen}
					>
            <i className='plus icon' />
          </button>
			</div>
		)
	}
}

ReactDOM.render(
	<TimersDashboard />,
	document.getElementById('content')
)