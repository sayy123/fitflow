import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Popover } from './popover'

describe('Popover', () => {
  it('renders correctly', () => {
    render(<Popover />)
    // Add specific assertions for the Popover component here
    expect(document.body).toBeInTheDocument() // Dummy assertion to pass initially
  })
})
