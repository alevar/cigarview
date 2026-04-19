import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import CigarPlot from "../CigarPlot/CigarPlot";
import { defaultSequence, defaultCigars } from "../../utils/mockData";
import "./Home.css";

const Home: React.FC = () => {
    const [sequence, setSequence] = useState<string>(defaultSequence);
    const [cigars, setCigars] = useState<{ value: string, flag: string }[]>(defaultCigars);

    const handleCigarChange = (index: number, value: string) => {
        const newCigars = [...cigars];
        newCigars[index] = { ...newCigars[index], value };
        setCigars(newCigars);
    };

    const handleFlagChange = (index: number, flag: string) => {
        const newCigars = [...cigars];
        newCigars[index] = { ...newCigars[index], flag };
        setCigars(newCigars);
    };

    const addCigar = () => {
        setCigars([...cigars, { value: "", flag: "" }]);
    };

    const removeCigar = (index: number) => {
        const newCigars = [...cigars];
        newCigars.splice(index, 1);
        setCigars(newCigars);
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">CigarView</h2>
            <Row>
                <Col md={4}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Header as="h5">Inputs</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">Read Sequence</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={3} 
                                    value={sequence}
                                    onChange={(e) => setSequence(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                    placeholder="Enter nucleotide sequence..."
                                />
                            </Form.Group>

                            <h6 className="fw-bold">CIGAR Strings</h6>
                            {cigars.map((cigarObj, index) => (
                                <Form.Group key={index} className="mb-2 d-flex">
                                    <Form.Control
                                        type="text"
                                        value={cigarObj.value}
                                        onChange={(e) => handleCigarChange(index, e.target.value.toUpperCase())}
                                        placeholder="e.g. 10M2I5M"
                                    />
                                    <Form.Control
                                        type="text"
                                        value={cigarObj.flag}
                                        onChange={(e) => handleFlagChange(index, e.target.value)}
                                        placeholder="Flag (e.g. 16)"
                                        style={{ width: '120px', marginLeft: '10px' }}
                                    />
                                    <Button 
                                        variant="outline-danger" 
                                        className="ms-2"
                                        onClick={() => removeCigar(index)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </Form.Group>
                            ))}
                            <Button variant="outline-primary" onClick={addCigar} size="sm" className="mt-2">
                                + Add CIGAR
                            </Button>
                        </Card.Body>
                    </Card>
                    
                    <Card className="shadow-sm mt-3">
                        <Card.Body>
                            <Card.Title>Legend</Card.Title>
                            <div className="d-flex flex-wrap gap-3 mt-3">
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#3182bd', marginRight: '5px'}}></span>
                                    <span>Match (M)</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#31a354', marginRight: '5px'}}></span>
                                    <span>Seq Match (=)</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#d95f0e', marginRight: '5px'}}></span>
                                    <span>Mismatch (X)</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '20px', height: '10px', backgroundColor: '#e6550d', marginRight: '5px'}}></span>
                                    <span>Insertion (I)</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '20px', height: '10px', backgroundColor: '#9c9c9c', marginRight: '5px'}}></span>
                                    <span>Soft Clip (S)</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '3px', height: '20px', backgroundColor: '#de2d26', marginRight: '5px', marginLeft: '8px'}}></span>
                                    <span>Deletion (D)</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '3px', height: '20px', backgroundColor: '#756bb1', marginRight: '5px', marginLeft: '8px'}}></span>
                                    <span>Skipped (N)</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span style={{display: 'inline-block', width: '3px', height: '20px', borderLeft: '2px dashed #636363', marginRight: '5px', marginLeft: '8px'}}></span>
                                    <span>Hard Clip (H)</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="shadow-sm">
                        <Card.Header as="h5">Visualization</Card.Header>
                        <Card.Body>
                            {sequence ? (
                                <CigarPlot sequence={sequence} cigars={cigars.filter(c => c.value.trim() !== "")} />
                            ) : (
                                <div className="text-center p-5 text-muted">
                                    Please enter a valid sequence to visualize.
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Home;
